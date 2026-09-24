import { config } from "dotenv";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";
import type { AnyDatabase } from "@/lib/db/tenant";

config({ path: [".env.local", ".env"], quiet: true });

export type Transport = "tcp" | "https";

/**
 * Scripts connect over Postgres TCP by default. `--https` uses Neon's HTTPS SQL endpoint
 * instead, for machines where outbound port 5432 is blocked but HTTPS is allowed (it can't run
 * interactive transactions, which migrations and the seed don't need). Behind an HTTP proxy,
 * also set NODE_USE_ENV_PROXY=1 so Node's fetch uses it.
 */
export function transportFromArgs(argv = process.argv): Transport {
  return argv.includes("--https") ? "https" : "tcp";
}

/** Migrations prefer the direct (unpooled) URL, as Neon recommends for schema changes. */
export function databaseUrl(kind: "app" | "migrations" = "app"): string | undefined {
  const url =
    kind === "migrations"
      ? (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)
      : process.env.DATABASE_URL;
  return url?.trim() || undefined;
}

export async function connect(url: string, transport: Transport) {
  if (transport === "https") {
    const { neon } = await import("@neondatabase/serverless");
    const db = drizzleNeonHttp(neon(url), { schema });
    return { db: db as unknown as AnyDatabase, neonHttp: db, pgPool: null, close: async () => {} };
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzlePg(pool, { schema });
  return { db: db as AnyDatabase, neonHttp: null, pgPool: pool, close: () => pool.end() };
}

/** "postgres://user:***@host/db" for logs. */
export function redact(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return `${u.protocol}//${u.username}${u.password ? ":***" : ""}@${u.host}${u.pathname}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}
