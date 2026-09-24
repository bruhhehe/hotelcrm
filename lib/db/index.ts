import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env/server";
import * as schema from "./schema";

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
  if (!env.DATABASE_URL) throw new DatabaseNotConfiguredError();

  const pool = globalForDb.lodgelyPool ?? new Pool({ connectionString: env.DATABASE_URL, max: 5 });
  globalForDb.lodgelyPool = pool;
  globalForDb.lodgelyDb = drizzle(pool, { schema });
  return globalForDb.lodgelyDb;
}

export { schema };
