/**
 * Applies pending Drizzle migrations. Runs before `next build` on Vercel (see `vercel-build`).
 * With the Neon ↔ Vercel integration each preview deploy gets its own DB branch, so this
 * migrates the preview branch, never production, until merged.
 * Skips cleanly when no database URL is set so a first "hello" deploy still builds.
 *
 *   pnpm db:migrate            # Postgres TCP (DATABASE_URL_UNPOOLED, else DATABASE_URL)
 *   pnpm db:migrate --https    # Neon over HTTPS, where port 5432 is blocked
 */
import { migrate as migrateNeonHttp } from "drizzle-orm/neon-http/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { connect, databaseUrl, redact, transportFromArgs } from "./lib/connect";

async function main() {
  const url = databaseUrl("migrations");
  if (!url) {
    console.warn("[migrate] DATABASE_URL not set, skipping migrations.");
    return;
  }
  const transport = transportFromArgs();
  console.info(`[migrate] ${redact(url)} over ${transport === "https" ? "HTTPS" : "TCP"}`);
  const conn = await connect(url, transport);
  try {
    if (conn.neonHttp) await migrateNeonHttp(conn.neonHttp, { migrationsFolder: "./drizzle" });
    else if (conn.pgPool) await migratePg(drizzle(conn.pgPool), { migrationsFolder: "./drizzle" });
    console.info("[migrate] Migrations applied.");
  } finally {
    await conn.close();
  }
}

main().catch((error: unknown) => {
  console.error("[migrate] Failed:", error);
  process.exit(1);
});
