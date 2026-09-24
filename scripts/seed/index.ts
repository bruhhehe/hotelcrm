/**
 * `pnpm db:seed` — (re)creates The Fell View Hotel demo tenant (spec §7).
 *
 * Only ever touches the demo: the hotel with slug `fell-view` (deleting it cascades to all of its
 * data) and users on the fellview.demo domain. Other hotels are never read or changed.
 *
 *   pnpm db:seed             # Postgres TCP, in one transaction
 *   pnpm db:seed --https     # Neon over HTTPS (not atomic; safe to re-run)
 */
import { createHash, randomBytes } from "node:crypto";
import { eq, like } from "drizzle-orm";
import type { PgInsertValue, PgTable } from "drizzle-orm/pg-core";
import { isoDateIn } from "@/lib/format/greeting";
import * as schema from "@/lib/db/schema";
import type { AnyDatabase } from "@/lib/db/tenant";
import { connect, databaseUrl, redact, transportFromArgs } from "../lib/connect";
import { DEMO_EMAIL_DOMAIN, DEMO_HOTEL, STAFF } from "./data";
import { generateSeed, type SeedPlan } from "./generate";

const CHUNK = 200;

async function insertAll<T extends PgTable>(db: AnyDatabase, table: T, rows: object[]) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.insert(table).values(rows.slice(i, i + CHUNK) as PgInsertValue<T>[]);
  }
}

async function writePlan(db: AnyDatabase, plan: SeedPlan) {
  // Remove the previous demo. Deleting the hotel cascades through every tenant table.
  await db.delete(schema.hotels).where(eq(schema.hotels.slug, DEMO_HOTEL.slug));
  await db.delete(schema.users).where(like(schema.users.email, `%@${DEMO_EMAIL_DOMAIN}`));

  await insertAll(db, schema.users, plan.users);
  await insertAll(db, schema.hotels, [plan.hotel]);
  await insertAll(db, schema.memberships, plan.memberships);
  await insertAll(db, schema.cancellationPolicies, plan.cancellationPolicies);
  await insertAll(db, schema.taxRates, plan.taxRates);
  await insertAll(db, schema.roomTypes, plan.roomTypes);
  await insertAll(db, schema.rooms, plan.rooms);
  await insertAll(db, schema.ratePlans, plan.ratePlans);
  await insertAll(db, schema.priceAdjustments, plan.priceAdjustments);
  await insertAll(db, schema.extras, plan.extras);
  await insertAll(db, schema.packages, plan.packages);
  await insertAll(db, schema.promoCodes, plan.promoCodes);
  await insertAll(db, schema.guests, plan.guests);
  await insertAll(db, schema.guestCompanions, plan.guestCompanions);
  await insertAll(db, schema.guestPreferences, plan.guestPreferences);
  await insertAll(db, schema.guestPackages, plan.guestPackages);
  await insertAll(db, schema.reservations, plan.reservations);
  await insertAll(db, schema.reservationRooms, plan.reservationRooms);
  await insertAll(db, schema.reservationExtras, plan.reservationExtras);
  await insertAll(db, schema.reservationStatusHistory, plan.reservationStatusHistory);
  await insertAll(db, schema.invoices, plan.invoices);
  await insertAll(db, schema.payments, plan.payments);
  await insertAll(db, schema.hotelCounters, plan.hotelCounters);
  await insertAll(db, schema.housekeepingTasks, plan.housekeepingTasks);
  await insertAll(db, schema.maintenanceIssues, plan.maintenanceIssues);
  await insertAll(db, schema.notifications, plan.notifications);
}

/**
 * A ready-to-click sign-in link for the owner, made exactly as Auth.js makes one (token stored
 * as sha256(token + AUTH_SECRET)). Only valid for an app running with the same AUTH_SECRET.
 */
async function ownerSignInLink(db: AnyDatabase): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  if (!secret) return null;
  const email = STAFF[0].email;
  const token = randomBytes(32).toString("hex");
  await db.insert(schema.verificationTokens).values({
    identifier: email,
    token: createHash("sha256").update(`${token}${secret}`).digest("hex"),
    expires: new Date(Date.now() + 24 * 3_600_000),
  });
  const params = new URLSearchParams({ callbackUrl: `${appUrl}/dashboard`, token, email });
  return `${appUrl}/api/auth/callback/resend?${params}`;
}

function summarise(plan: SeedPlan, today: string) {
  const count = (status: string) => plan.reservations.filter((r) => r.status === status).length;
  const arrivals = plan.reservations.filter((r) => r.checkIn === today && r.status !== "cancelled");
  const departures = plan.reservations.filter(
    (r) => r.checkOut === today && r.status !== "cancelled",
  );
  return [
    `  ${plan.hotel.name} (/stay/${plan.hotel.slug}) · ${plan.rooms.length} rooms · ${plan.guests.length} guests`,
    `  ${plan.reservations.length} reservations: ${count("confirmed")} confirmed, ${count("checked_in")} in house, ${count("checked_out")} checked out, ${count("pending_validation")} awaiting validation, ${count("cancelled")} cancelled, ${count("no_show")} no-shows`,
    `  Today (${today}): ${arrivals.filter((r) => r.status === "checked_in").length}/${arrivals.length} arrivals in, ${departures.filter((r) => r.status === "checked_out").length}/${departures.length} departures out`,
    `  ${plan.invoices.length} invoices · ${plan.payments.length} payments · ${plan.housekeepingTasks.length} housekeeping tasks today`,
    `  Staff: ${STAFF.map((s) => `${s.email} (${s.role})`).join(", ")}`,
  ].join("\n");
}

async function main() {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (isProduction && process.env.ALLOW_SEED !== "1") {
    throw new Error("Refusing to seed a production environment. Set ALLOW_SEED=1 to override.");
  }
  const url = databaseUrl("app");
  if (!url) throw new Error("DATABASE_URL is not set.");
  const transport = transportFromArgs();
  console.info(`[seed] ${redact(url)} over ${transport === "https" ? "HTTPS" : "TCP"}`);

  const now = new Date();
  const today = isoDateIn(now, DEMO_HOTEL.timezone);
  const plan = generateSeed({ today, now });

  const conn = await connect(url, transport);
  try {
    if (conn.pgPool) {
      await conn.db.transaction((tx) => writePlan(tx, plan));
    } else {
      await writePlan(conn.db, plan);
    }
    console.info(`[seed] Seeded The Fell View Hotel:\n${summarise(plan, today)}`);
    const link = transport === "tcp" ? await ownerSignInLink(conn.db) : null;
    if (link) {
      console.info(`\n🔑  Sign in as Robert (valid 24h, once):\n    ${link}\n`);
    } else {
      console.info(
        `\n    Sign in at /login as ${STAFF[0].email}; the magic link is emailed, or printed by the dev server when Resend isn't configured.\n`,
      );
    }
  } finally {
    await conn.close();
  }
}

main().catch((error: unknown) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});
