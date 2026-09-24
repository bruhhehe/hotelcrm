import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import * as schema from "./index";

/** Tables that are not tenant data: auth, and the tenancy roots themselves. */
const GLOBAL_TABLES = new Set([
  "users",
  "accounts",
  "sessions",
  "verification_tokens",
  "hotel_groups",
  "hotels",
]);

// Every exported table object (enums and types are skipped).
const tables = Object.values(schema).filter((v) => is(v, PgTable)) as unknown as PgTable[];

describe("schema tenancy", () => {
  it("defines the full §3 model", () => {
    const names = tables.map((t) => getTableConfig(t).name).sort();
    for (const required of [
      "hotel_groups",
      "hotels",
      "memberships",
      "staff_calendars",
      "room_types",
      "rooms",
      "rate_plans",
      "price_adjustments",
      "capacity_overrides",
      "availability_rules",
      "extras",
      "packages",
      "promo_codes",
      "guests",
      "guest_companions",
      "guest_documents",
      "guest_preferences",
      "reservations",
      "reservation_rooms",
      "reservation_extras",
      "reservation_status_history",
      "tax_rates",
      "invoices",
      "payments",
      "cancellation_policies",
      "housekeeping_tasks",
      "maintenance_issues",
      "guest_messages",
      "automations",
      "sms_credits",
      "notifications",
      "audit_log",
      "daily_stats",
    ]) {
      expect(names).toContain(required);
    }
  });

  it.each(
    tables
      .filter((t) => !GLOBAL_TABLES.has(getTableConfig(t).name))
      .map((t) => [getTableConfig(t).name, t] as const),
  )("%s has a non-null hotel_id referencing hotels", (_name, table) => {
    const config = getTableConfig(table);
    const hotelId = config.columns.find((c) => c.name === "hotel_id");
    expect(hotelId?.notNull).toBe(true);
    const refsHotels = config.foreignKeys.some((fk) => {
      const ref = fk.reference();
      return (
        ref.columns.map((c) => c.name).join() === "hotel_id" &&
        getTableConfig(ref.foreignTable).name === "hotels"
      );
    });
    expect(refsHotels).toBe(true);
  });

  it("gives every tenant table with an id a (hotel_id, id) key for composite foreign keys", () => {
    for (const table of tables) {
      const config = getTableConfig(table);
      if (GLOBAL_TABLES.has(config.name) || !config.columns.some((c) => c.name === "id")) continue;
      const hasKey = config.uniqueConstraints.some(
        (u) => u.columns.map((c) => c.name).join() === "hotel_id,id",
      );
      expect(hasKey, `${config.name} is missing unique (hotel_id, id)`).toBe(true);
    }
  });
});
