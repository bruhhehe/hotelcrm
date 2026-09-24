import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { databaseUrl } from "@/lib/env/server";
import * as schema from "./schema";
import { forHotel, type HotelDb } from "./tenant";

export type Database = NodePgDatabase<typeof schema>;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "DATABASE_URL is not set. Connect Neon in Vercel (Storage → Neon) or set it in .env.local.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

/*
 * node-postgres works identically against Neon (use the pooled "-pooler" URL) and a
 * local/CI Postgres, and supports interactive transactions + SELECT … FOR UPDATE,
 * which the availability engine needs to prevent double bookings.
 * The pool is cached on globalThis so dev hot-reload and warm serverless invocations reuse it.
 */
const globalForDb = globalThis as unknown as { lodgelyPool?: Pool; lodgelyDb?: Database };

export function getDb(): Database {
  if (globalForDb.lodgelyDb) return globalForDb.lodgelyDb;
  if (!databaseUrl) throw new DatabaseNotConfiguredError();

  const pool = globalForDb.lodgelyPool ?? new Pool({ connectionString: databaseUrl, max: 5 });
  globalForDb.lodgelyPool = pool;
  globalForDb.lodgelyDb = drizzle(pool, { schema });
  return globalForDb.lodgelyDb;
}

export { schema };

/**
 * The spec's entry point for tenant data: `db.forHotel(hotelId).select(schema.guests)`.
 * App code uses this (never `getDb()` directly) so every query is scoped to one hotel.
 */
export const db = {
  forHotel: (hotelId: string) => forHotel(getDb(), hotelId),
};

/** Run `fn` in one transaction with a hotel-scoped handle (locks, counters, multi-row writes). */
export function withHotelTransaction<T>(hotelId: string, fn: (tx: HotelDb) => Promise<T>) {
  return getDb().transaction((tx) => fn(forHotel(tx, hotelId)));
}

export { forHotel, type HotelDb };
