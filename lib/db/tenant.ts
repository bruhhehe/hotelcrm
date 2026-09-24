import { and, eq, isNull, type SQL } from "drizzle-orm";
import type {
  AnyPgColumn,
  PgDatabase,
  PgInsertValue,
  PgQueryResultHKT,
  PgTable,
  PgUpdateSetSource,
} from "drizzle-orm/pg-core";
import type * as schema from "./schema";

/**
 * Any Drizzle Postgres database or transaction over the Lodgely schema: node-postgres in the app,
 * Neon HTTP in scripts that run where only HTTPS is reachable.
 */
export type AnyDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;

/** A table with a hotel_id column. Soft-deletable tables also have deleted_at. */
export type TenantTable = PgTable & { hotelId: AnyPgColumn; deletedAt?: AnyPgColumn };

export type ScopeOptions = {
  /** Include soft-deleted rows (restores, audits, GDPR exports). Default false. */
  withDeleted?: boolean;
};

/**
 * The hotel-scoped database handle. Every tenant query goes through one of these, so the
 * `hotel_id = …` condition can't be forgotten. ESLint forbids importing `getDb` outside the
 * data layer (see eslint.config.mjs), and a schema test checks every tenant table has
 * `hotel_id`. Composite foreign keys stop a row from pointing at another hotel's data even if
 * a query went wrong.
 */
export type HotelDb = ReturnType<typeof forHotel>;

export function forHotel(db: AnyDatabase, hotelId: string) {
  if (!hotelId) throw new Error("forHotel: hotelId is required");

  function scope(table: TenantTable, where?: SQL, options: ScopeOptions = {}): SQL {
    const conditions: (SQL | undefined)[] = [eq(table.hotelId, hotelId), where];
    if (table.deletedAt && !options.withDeleted) conditions.push(isNull(table.deletedAt));
    // `and` of at least one defined condition is always defined.
    return and(...conditions) as SQL;
  }

  return {
    hotelId,
    /** Raw handle for queries that compose `scope()` themselves (joins, aggregates). */
    db,
    /** `hotel_id = <this hotel>` [and deleted_at is null] [and where], for any query. */
    scope,

    /**
     * Rows of `table` for this hotel. For joins, ordering on other tables or aggregates, write
     * the query on `db` and put `scope(table, …)` in its where clause.
     */
    async select<T extends TenantTable>(
      table: T,
      where?: SQL,
      options: ScopeOptions & { orderBy?: SQL | SQL[]; limit?: number } = {},
    ): Promise<T["$inferSelect"][]> {
      const query = db
        .select()
        .from(table as PgTable)
        .where(scope(table, where, options))
        .$dynamic();
      if (options.orderBy) {
        query.orderBy(...(Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]));
      }
      if (options.limit !== undefined) query.limit(options.limit);
      return (await query) as T["$inferSelect"][];
    },

    insert<T extends TenantTable>(
      table: T,
      values: Omit<T["$inferInsert"], "hotelId"> | Omit<T["$inferInsert"], "hotelId">[],
    ) {
      const rows = (Array.isArray(values) ? values : [values]).map(
        (row) => ({ ...row, hotelId }) as PgInsertValue<T>,
      );
      return db.insert(table).values(rows);
    },

    update<T extends TenantTable>(table: T, set: PgUpdateSetSource<T>, where?: SQL) {
      return db
        .update(table)
        .set(set)
        .where(scope(table, where, { withDeleted: true }));
    },

    /** Hard delete. Prefer `softDelete` for anything a user might want back. */
    delete<T extends TenantTable>(table: T, where?: SQL) {
      return db.delete(table).where(scope(table, where, { withDeleted: true }));
    },

    softDelete<T extends TenantTable & { deletedAt: AnyPgColumn }>(table: T, where?: SQL) {
      return db
        .update(table)
        .set({ deletedAt: new Date() } as PgUpdateSetSource<T>)
        .where(scope(table, where));
    },
  };
}
