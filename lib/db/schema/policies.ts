import { sql } from "drizzle-orm";
import { boolean, check, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { deletedAt, id, tenantKey, timestamps } from "./_shared";
import { taxModeEnum } from "./enums";
import { hotelRef } from "./tenancy";

/**
 * Rules sorted by `daysBefore` descending: cancelling at least `daysBefore` days before arrival
 * costs `chargeBp` of the stay (basis points, 10000 = 100%). The first rule that applies wins;
 * cancelling later than every rule costs 100%.
 */
export type CancellationRule = { daysBefore: number; chargeBp: number };

export const cancellationPolicies = pgTable(
  "cancellation_policies",
  {
    id: id(),
    hotelId: hotelRef(),
    name: text("name").notNull(),
    rules: jsonb("rules").$type<CancellationRule[]>().notNull().default([]),
    /** Share of the stay charged for a no-show, in basis points. */
    noShowChargeBp: integer("no_show_charge_bp").notNull().default(10000),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("cancellation_policies", t.hotelId, t.id),
    check("cancellation_policies_no_show_bp_range", sql`${t.noShowChargeBp} between 0 and 10000`),
  ],
);

/** Tax rates in basis points (2000 = 20%). "included" = UK/EU VAT-inclusive prices. */
export const taxRates = pgTable(
  "tax_rates",
  {
    id: id(),
    hotelId: hotelRef(),
    name: text("name").notNull(),
    rateBp: integer("rate_bp").notNull(),
    mode: taxModeEnum("mode").notNull().default("included"),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("tax_rates", t.hotelId, t.id),
    check("tax_rates_rate_bp_range", sql`${t.rateBp} between 0 and 10000`),
  ],
);
