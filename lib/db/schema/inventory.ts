import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { deletedAt, id, tenantFk, tenantKey, timestamps } from "./_shared";
import {
  adjustmentTypeEnum,
  availabilityRuleKindEnum,
  extraCategoryEnum,
  extraPricingModeEnum,
  packageKindEnum,
  promoTypeEnum,
  roomStatusEnum,
} from "./enums";
import { cancellationPolicies, taxRates } from "./policies";
import { hotelRef } from "./tenancy";

/*
 * Money is stored in integer minor units (pence, cents) in the hotel's currency. Percentages are
 * integer basis points (1500 = 15%). Dates that belong to the hotel's calendar (stay nights,
 * seasons) are Postgres `date` mapped to "YYYY-MM-DD" strings, never timestamps, so a stay can't
 * shift a day across timezones.
 */

export type Photo = { url: string; alt: string };

export const roomTypes = pgTable(
  "room_types",
  {
    id: id(),
    hotelId: hotelRef(),
    name: text("name").notNull(),
    description: text("description"),
    baseOccupancy: smallint("base_occupancy").notNull().default(2),
    maxOccupancy: smallint("max_occupancy").notNull().default(2),
    bedConfig: text("bed_config"),
    amenities: text("amenities")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    photos: jsonb("photos").$type<Photo[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    isBookableOnline: boolean("is_bookable_online").notNull().default(true),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("room_types", t.hotelId, t.id),
    check(
      "room_types_occupancy_valid",
      sql`${t.baseOccupancy} >= 1 and ${t.maxOccupancy} >= ${t.baseOccupancy}`,
    ),
  ],
);

export const rooms = pgTable(
  "rooms",
  {
    id: id(),
    hotelId: hotelRef(),
    roomTypeId: text("room_type_id").notNull(),
    /** Room number or name as shown to staff and guests ("7", "Garden Cottage"). */
    name: text("name").notNull(),
    floor: text("floor"),
    status: roomStatusEnum("status").notNull().default("clean"),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("rooms", t.hotelId, t.id),
    tenantFk("rooms_room_type_fk", [t.hotelId, t.roomTypeId], [roomTypes.hotelId, roomTypes.id]),
    uniqueIndex("rooms_hotel_name_key")
      .on(t.hotelId, t.name)
      .where(sql`${t.deletedAt} is null`),
    index("rooms_room_type_idx").on(t.hotelId, t.roomTypeId),
  ],
);

export const ratePlans = pgTable(
  "rate_plans",
  {
    id: id(),
    hotelId: hotelRef(),
    roomTypeId: text("room_type_id").notNull(),
    name: text("name").notNull(),
    baseNightlyPrice: integer("base_nightly_price").notNull(),
    includesBreakfast: boolean("includes_breakfast").notNull().default(false),
    cancellationPolicyId: text("cancellation_policy_id"),
    minNights: smallint("min_nights").notNull().default(1),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("rate_plans", t.hotelId, t.id),
    tenantFk(
      "rate_plans_room_type_fk",
      [t.hotelId, t.roomTypeId],
      [roomTypes.hotelId, roomTypes.id],
    ),
    tenantFk(
      "rate_plans_cancellation_policy_fk",
      [t.hotelId, t.cancellationPolicyId],
      [cancellationPolicies.hotelId, cancellationPolicies.id],
    ),
    index("rate_plans_room_type_idx").on(t.hotelId, t.roomTypeId),
    check("rate_plans_price_non_negative", sql`${t.baseNightlyPrice} >= 0`),
    check("rate_plans_min_nights_positive", sql`${t.minNights} >= 1`),
  ],
);

/**
 * Seasonal or weekday pricing. `value` is basis points for "percentage" (-1000 = 10% off),
 * minor units added per night for "fixed", and the replacement nightly price for "override".
 * `weekdayMask` bit 0 = Monday … bit 6 = Sunday; 127 = every day. With `repeatsYearly` only the
 * month and day of the range matter.
 */
export const priceAdjustments = pgTable(
  "price_adjustments",
  {
    id: id(),
    hotelId: hotelRef(),
    ratePlanId: text("rate_plan_id"),
    roomTypeId: text("room_type_id"),
    dateFrom: date("date_from", { mode: "string" }).notNull(),
    dateTo: date("date_to", { mode: "string" }).notNull(),
    type: adjustmentTypeEnum("type").notNull(),
    value: integer("value").notNull(),
    label: text("label").notNull(),
    repeatsYearly: boolean("repeats_yearly").notNull().default(false),
    weekdayMask: smallint("weekday_mask").notNull().default(127),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("price_adjustments", t.hotelId, t.id),
    tenantFk(
      "price_adjustments_rate_plan_fk",
      [t.hotelId, t.ratePlanId],
      [ratePlans.hotelId, ratePlans.id],
      "cascade",
    ),
    tenantFk(
      "price_adjustments_room_type_fk",
      [t.hotelId, t.roomTypeId],
      [roomTypes.hotelId, roomTypes.id],
      "cascade",
    ),
    index("price_adjustments_range_idx").on(t.hotelId, t.dateFrom, t.dateTo),
    check("price_adjustments_range_valid", sql`${t.dateTo} >= ${t.dateFrom}`),
    check("price_adjustments_weekday_mask", sql`${t.weekdayMask} between 1 and 127`),
    check(
      "price_adjustments_override_non_negative",
      sql`${t.type} <> 'override' or ${t.value} >= 0`,
    ),
  ],
);

/** Rooms sellable per night for a room type over a date range (e.g. 3 blocked for renovation). */
export const capacityOverrides = pgTable(
  "capacity_overrides",
  {
    id: id(),
    hotelId: hotelRef(),
    roomTypeId: text("room_type_id").notNull(),
    dateFrom: date("date_from", { mode: "string" }).notNull(),
    dateTo: date("date_to", { mode: "string" }).notNull(),
    roomsAvailable: smallint("rooms_available").notNull(),
    label: text("label").notNull(),
    repeatsYearly: boolean("repeats_yearly").notNull().default(false),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("capacity_overrides", t.hotelId, t.id),
    tenantFk(
      "capacity_overrides_room_type_fk",
      [t.hotelId, t.roomTypeId],
      [roomTypes.hotelId, roomTypes.id],
      "cascade",
    ),
    index("capacity_overrides_range_idx").on(t.hotelId, t.roomTypeId, t.dateFrom),
    check("capacity_overrides_range_valid", sql`${t.dateTo} >= ${t.dateFrom}`),
    check("capacity_overrides_rooms_non_negative", sql`${t.roomsAvailable} >= 0`),
  ],
);

/**
 * Closed dates, closed-to-arrival, closed-to-departure and minimum stays. A null room type or
 * rate plan means the rule applies hotel-wide.
 */
export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: id(),
    hotelId: hotelRef(),
    kind: availabilityRuleKindEnum("kind").notNull(),
    roomTypeId: text("room_type_id"),
    ratePlanId: text("rate_plan_id"),
    dateFrom: date("date_from", { mode: "string" }).notNull(),
    dateTo: date("date_to", { mode: "string" }).notNull(),
    /** Required for kind = min_stay. */
    minNights: smallint("min_nights"),
    label: text("label"),
    repeatsYearly: boolean("repeats_yearly").notNull().default(false),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("availability_rules", t.hotelId, t.id),
    tenantFk(
      "availability_rules_room_type_fk",
      [t.hotelId, t.roomTypeId],
      [roomTypes.hotelId, roomTypes.id],
      "cascade",
    ),
    tenantFk(
      "availability_rules_rate_plan_fk",
      [t.hotelId, t.ratePlanId],
      [ratePlans.hotelId, ratePlans.id],
      "cascade",
    ),
    index("availability_rules_range_idx").on(t.hotelId, t.dateFrom, t.dateTo),
    check("availability_rules_range_valid", sql`${t.dateTo} >= ${t.dateFrom}`),
    check(
      "availability_rules_min_stay_has_nights",
      sql`${t.kind} <> 'min_stay' or ${t.minNights} >= 1`,
    ),
  ],
);

export const extras = pgTable(
  "extras",
  {
    id: id(),
    hotelId: hotelRef(),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull(),
    pricingMode: extraPricingModeEnum("pricing_mode").notNull(),
    category: extraCategoryEnum("category").notNull().default("other"),
    taxRateId: text("tax_rate_id"),
    isBookableOnline: boolean("is_bookable_online").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("extras", t.hotelId, t.id),
    tenantFk("extras_tax_rate_fk", [t.hotelId, t.taxRateId], [taxRates.hotelId, taxRates.id]),
    check("extras_price_non_negative", sql`${t.price} >= 0`),
  ],
);

/**
 * Prepaid products (Pro plan): "5 nights any time", gift cards, monthly-stay passes.
 * `nightsIncluded` null = unlimited nights (passes); `valueAmount` is a gift card's face value.
 */
export const packages = pgTable(
  "packages",
  {
    id: id(),
    hotelId: hotelRef(),
    name: text("name").notNull(),
    kind: packageKindEnum("kind").notNull(),
    price: integer("price").notNull(),
    nightsIncluded: smallint("nights_included"),
    valueAmount: integer("value_amount"),
    validityDays: smallint("validity_days").notNull(),
    applicableRoomTypeIds: text("applicable_room_type_ids")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("packages", t.hotelId, t.id),
    check("packages_price_non_negative", sql`${t.price} >= 0`),
    check("packages_validity_positive", sql`${t.validityDays} >= 1`),
  ],
);

/** Codes are stored upper-case; lookups upper-case the input. Empty room-type list = all. */
export const promoCodes = pgTable(
  "promo_codes",
  {
    id: id(),
    hotelId: hotelRef(),
    code: text("code").notNull(),
    type: promoTypeEnum("type").notNull(),
    /** Basis points for "percentage", minor units off the stay for "fixed". */
    value: integer("value").notNull(),
    roomTypeIds: text("room_type_ids")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    minNights: smallint("min_nights"),
    maxNights: smallint("max_nights"),
    validFrom: date("valid_from", { mode: "string" }),
    validTo: date("valid_to", { mode: "string" }),
    maxUses: integer("max_uses"),
    usedCount: integer("used_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("promo_codes", t.hotelId, t.id),
    uniqueIndex("promo_codes_hotel_code_key")
      .on(t.hotelId, t.code)
      .where(sql`${t.deletedAt} is null`),
    check("promo_codes_code_upper", sql`${t.code} = upper(${t.code})`),
    check("promo_codes_value_positive", sql`${t.value} > 0`),
    check("promo_codes_percentage_max", sql`${t.type} <> 'percentage' or ${t.value} <= 10000`),
    check(
      "promo_codes_used_within_max",
      sql`${t.maxUses} is null or ${t.usedCount} <= ${t.maxUses}`,
    ),
  ],
);
