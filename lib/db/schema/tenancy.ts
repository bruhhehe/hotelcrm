import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { HotelSettingsInput } from "@/lib/hotels/settings";
import { deletedAt, id, tenantKey, timestamps } from "./_shared";
import { users } from "./auth";
import { membershipRoleEnum, planEnum } from "./enums";

export type PostalAddress = {
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postcode: string;
  /** ISO 3166-1 alpha-2, e.g. "GB". */
  country: string;
};

export const hotelGroups = pgTable("hotel_groups", {
  id: id(),
  name: text("name").notNull(),
  ownerUserId: text("owner_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  ...timestamps(),
});

export const hotels = pgTable(
  "hotels",
  {
    id: id(),
    groupId: text("group_id").references(() => hotelGroups.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    /** Public identifier in /stay/{slug}. Lowercase letters, digits and hyphens. */
    slug: text("slug").notNull(),
    /** IANA timezone, e.g. "Europe/London". Every hotel-local date is computed in it. */
    timezone: text("timezone").notNull().default("Europe/London"),
    currency: text("currency").notNull().default("GBP"),
    locale: text("locale").notNull().default("en"),
    address: jsonb("address").$type<PostalAddress>(),
    phone: text("phone"),
    email: text("email"),
    logoUrl: text("logo_url"),
    brandColor: text("brand_color"),
    checkInTime: time("check_in_time").notNull().default("15:00"),
    checkOutTime: time("check_out_time").notNull().default("11:00"),
    plan: planEnum("plan").notNull().default("core"),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    /** Lodgely's own SaaS subscription customer (Stripe Billing). */
    stripeCustomerId: text("stripe_customer_id"),
    /** The hotel's connected account for guest payments (Stripe Connect Standard). */
    stripeConnectAccountId: text("stripe_connect_account_id"),
    settings: jsonb("settings").$type<HotelSettingsInput>().notNull().default({}),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    uniqueIndex("hotels_slug_key").on(t.slug),
    index("hotels_group_id_idx").on(t.groupId),
    check("hotels_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check("hotels_currency_supported", sql`${t.currency} in ('GBP', 'EUR', 'USD', 'CAD')`),
    check("hotels_locale_supported", sql`${t.locale} in ('en', 'fr', 'de', 'nl', 'es')`),
  ],
);

/** Hotel column for tenant tables. Deleting a hotel removes all of its data. */
export const hotelRef = () =>
  text("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" });

export const memberships = pgTable(
  "memberships",
  {
    id: id(),
    hotelId: hotelRef(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("memberships_hotel_user_key").on(t.hotelId, t.userId),
    index("memberships_user_id_idx").on(t.userId),
    tenantKey("memberships", t.hotelId, t.id),
  ],
);

/** Pending team invitations. The token itself is never stored, only its SHA-256 hash. */
export const invites = pgTable(
  "invites",
  {
    id: id(),
    hotelId: hotelRef(),
    email: text("email").notNull(),
    role: membershipRoleEnum("role").notNull(),
    tokenHash: text("token_hash").notNull(),
    invitedByUserId: text("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("invites_token_hash_key").on(t.tokenHash),
    index("invites_hotel_email_idx").on(t.hotelId, t.email),
    tenantKey("invites", t.hotelId, t.id),
  ],
);

export const staffCalendars = pgTable(
  "staff_calendars",
  {
    id: id(),
    hotelId: hotelRef(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Encrypted at rest by the app (Phase 13); never stored in plain text. */
    googleRefreshTokenEncrypted: text("google_refresh_token_encrypted"),
    calendarId: text("calendar_id"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("staff_calendars_hotel_user_key").on(t.hotelId, t.userId),
    tenantKey("staff_calendars", t.hotelId, t.id),
  ],
);

/**
 * Per-hotel sequences (reservation references, invoice numbers). Incremented with
 * `update … returning` inside the same transaction as the row that uses the number, so a
 * rolled-back transaction never burns a number: invoice numbering stays gap-free.
 */
export const hotelCounters = pgTable(
  "hotel_counters",
  {
    hotelId: hotelRef(),
    name: text("name").notNull(),
    value: integer("value").notNull().default(0),
  },
  (t) => [
    primaryKey({ name: "hotel_counters_pkey", columns: [t.hotelId, t.name] }),
    check("hotel_counters_value_non_negative", sql`${t.value} >= 0`),
  ],
);
