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
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { deletedAt, id, tenantFk, tenantKey, timestamps } from "./_shared";
import {
  bookingSourceEnum,
  companionRelationshipEnum,
  guestPackageStatusEnum,
  portalStatusEnum,
} from "./enums";
import { packages, rooms } from "./inventory";
import { hotelRef, type PostalAddress } from "./tenancy";

/** The booker / account holder. Companions are the people who stay with them. */
export const guests = pgTable(
  "guests",
  {
    id: id(),
    hotelId: hotelRef(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    /** Stored lower-cased. */
    email: text("email"),
    /** E.164, e.g. "+447700900123". */
    phone: text("phone"),
    address: jsonb("address").$type<PostalAddress>(),
    /** ISO 3166-1 alpha-2; feeds the analytics nationality breakdown. */
    nationality: text("nationality"),
    language: text("language").notNull().default("en"),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    notes: text("notes"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    portalStatus: portalStatusEnum("portal_status").notNull().default("none"),
    noShowCount: smallint("no_show_count").notNull().default(0),
    isVip: boolean("is_vip").notNull().default(false),
    isBlacklisted: boolean("is_blacklisted").notNull().default(false),
    source: bookingSourceEnum("source").notNull().default("other"),
    /** Set by the inactivity automation once the win-back sequence has finished. */
    lapsedAt: timestamp("lapsed_at", { withTimezone: true }),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("guests", t.hotelId, t.id),
    index("guests_hotel_email_idx").on(t.hotelId, t.email),
    index("guests_hotel_name_idx").on(t.hotelId, t.lastName, t.firstName),
    check("guests_email_lower", sql`${t.email} is null or ${t.email} = lower(${t.email})`),
    check("guests_phone_e164", sql`${t.phone} is null or ${t.phone} ~ '^\\+[1-9][0-9]{6,14}$'`),
    check("guests_no_show_non_negative", sql`${t.noShowCount} >= 0`),
  ],
);

export const guestCompanions = pgTable(
  "guest_companions",
  {
    id: id(),
    hotelId: hotelRef(),
    guestId: text("guest_id").notNull(),
    name: text("name").notNull(),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    relationship: companionRelationshipEnum("relationship").notNull().default("other"),
    /** Dietary and accessibility notes. */
    notes: text("notes"),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("guest_companions", t.hotelId, t.id),
    tenantFk(
      "guest_companions_guest_fk",
      [t.hotelId, t.guestId],
      [guests.hotelId, guests.id],
      "cascade",
    ),
    index("guest_companions_guest_idx").on(t.hotelId, t.guestId),
  ],
);

/** Shown on every booking of this guest. One row per guest. */
export const guestPreferences = pgTable(
  "guest_preferences",
  {
    id: id(),
    hotelId: hotelRef(),
    guestId: text("guest_id").notNull(),
    pillowType: text("pillow_type"),
    floorPreference: text("floor_preference"),
    allergies: text("allergies"),
    /** "Always room 7". */
    preferredRoomId: text("preferred_room_id"),
    notes: text("notes"),
    ...timestamps(),
  },
  (t) => [
    tenantKey("guest_preferences", t.hotelId, t.id),
    uniqueIndex("guest_preferences_guest_key").on(t.hotelId, t.guestId),
    tenantFk(
      "guest_preferences_guest_fk",
      [t.hotelId, t.guestId],
      [guests.hotelId, guests.id],
      "cascade",
    ),
    tenantFk(
      "guest_preferences_room_fk",
      [t.hotelId, t.preferredRoomId],
      [rooms.hotelId, rooms.id],
    ),
  ],
);

/** A package or gift card a guest bought. Redemption decrements what remains. */
export const guestPackages = pgTable(
  "guest_packages",
  {
    id: id(),
    hotelId: hotelRef(),
    guestId: text("guest_id").notNull(),
    packageId: text("package_id").notNull(),
    status: guestPackageStatusEnum("status").notNull().default("active"),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    /** Null for unlimited passes. */
    nightsRemaining: smallint("nights_remaining"),
    /** Gift card balance in minor units. */
    amountRemaining: integer("amount_remaining"),
    ...timestamps(),
  },
  (t) => [
    tenantKey("guest_packages", t.hotelId, t.id),
    tenantFk("guest_packages_guest_fk", [t.hotelId, t.guestId], [guests.hotelId, guests.id]),
    tenantFk(
      "guest_packages_package_fk",
      [t.hotelId, t.packageId],
      [packages.hotelId, packages.id],
    ),
    index("guest_packages_guest_idx").on(t.hotelId, t.guestId),
    check(
      "guest_packages_remaining_non_negative",
      sql`coalesce(${t.nightsRemaining}, 0) >= 0 and coalesce(${t.amountRemaining}, 0) >= 0`,
    ),
  ],
);
