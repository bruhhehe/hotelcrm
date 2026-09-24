import { createId } from "@paralleldrive/cuid2";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

/** Database tests run only against an explicit, migrated TEST_DATABASE_URL. */
export const describeDb = TEST_DATABASE_URL
  ? (await import("vitest")).describe
  : (await import("vitest")).describe.skip;

export function connectTestDb(): { db: NodePgDatabase<typeof schema>; pool: Pool } {
  if (!TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
  const pool = new Pool({ connectionString: TEST_DATABASE_URL, max: 2 });
  return { db: drizzle(pool, { schema }), pool };
}

/** A throwaway hotel; delete it to cascade everything created under it. */
export async function createTestHotel(db: NodePgDatabase<typeof schema>, name = "Test Hotel") {
  const slug = `test-${createId().slice(0, 10)}`;
  const [hotel] = await db.insert(schema.hotels).values({ name, slug }).returning();
  if (!hotel) throw new Error("failed to create test hotel");
  return hotel;
}

/** Postgres SQLSTATE of a failed query (drizzle wraps the driver error in `cause`). */
export function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e.cause?.code ?? e.code;
}
