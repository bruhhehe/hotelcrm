import { createId } from "@paralleldrive/cuid2";
import { type AnyPgColumn, foreignKey, text, timestamp, unique } from "drizzle-orm/pg-core";

/** cuid2 primary key, generated app-side so ids are known before insert. */
export const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const deletedAt = () => timestamp("deleted_at", { withTimezone: true });

export const timestamps = () => ({ createdAt: createdAt(), updatedAt: updatedAt() });

/**
 * Every tenant table carries `unique (hotel_id, id)` so children can reference it with a
 * composite foreign key. That makes a cross-hotel reference (hotel A's reservation pointing at
 * hotel B's guest) impossible at the database level, not just in application code.
 */
export const tenantKey = (table: string, hotelId: AnyPgColumn, rowId: AnyPgColumn) =>
  unique(`${table}_hotel_id_id_key`).on(hotelId, rowId);

type FkAction = "cascade" | "restrict" | "set null" | "no action";

/**
 * Composite `(hotel_id, <ref>_id) → parent (hotel_id, id)` foreign key. With MATCH SIMPLE (the
 * default) a null `<ref>_id` skips the check, so optional references work unchanged.
 * `set null` is not offered: it would null `hotel_id` too. The default is `no action`, not
 * `restrict`: both block deleting a referenced row, but `no action` is checked at the end of the
 * statement, so deleting a whole hotel can cascade through every table in one go.
 */
export const tenantFk = (
  name: string,
  columns: [AnyPgColumn, AnyPgColumn],
  parent: [AnyPgColumn, AnyPgColumn],
  onDelete: Exclude<FkAction, "set null"> = "no action",
) => foreignKey({ name, columns, foreignColumns: parent }).onDelete(onDelete);
