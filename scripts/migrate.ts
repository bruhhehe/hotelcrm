/**
 * Applies pending Drizzle migrations. Runs before `next build` on Vercel (see `vercel-build`).
 * With the Neon ↔ Vercel integration each preview deploy gets its own DB branch, so this
 * migrates the preview branch, never production, until merged.
 * Skips cleanly when DATABASE_URL isn't set so a first "hello" deploy still builds.
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[migrate] DATABASE_URL not set, skipping migrations.");
    return;
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
    console.info("[migrate] Migrations applied.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("[migrate] Failed:", error);
  process.exit(1);
});
