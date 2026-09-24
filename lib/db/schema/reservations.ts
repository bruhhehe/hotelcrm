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
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { deletedAt, id, tenantFk, tenantKey, timestamps } from "./_shared";
import { users } from "./auth";
import {
  actorKindEnum,
  bookingSourceEnum,
  createdViaEnum,
  documentTypeEnum,
  extraPricingModeEnum,
  reservationStatusEnum,
} from "./enums";
import { guests } from "./guests";
import { extras, promoCodes, ratePlans, rooms, roomTypes } from "./inventory";
import { cancellationPolicies } from "./policies";
import { hotelRef } from "./tenancy";

/** One night's price, frozen at booking time so later rate changes never rewrite history. */
export type NightlyPrice = { date: string; amount: number };

/** A manual override applied on top of the computed price (at most one per reservation). */
export type PriceOverride =
  | { type: "discount_bp"; value: number }
  | { type: "discount_amount"; value: number }
  | { type: "fixed_total"; value: number };

export const reservations = pgTable(
  "reservations",
  {
    id: id(),
    hotelId: hotelRef(),
    /** Human reference, unique per hotel: "LDG-000123". */
    reference: text("reference").notNull(),
    guestId: text("guest_id").notNull(),
    status: reservationStatusEnum("status").notNull().default("confirmed"),
    source: bookingSourceEnum("source").notNull(),
    /** The OTA's own booking id, for imported reservations. */
    externalRef: text("external_ref"),
    checkIn: date("check_in", { mode: "string" }).notNull(),
    checkOut: date("check_out", { mode: "string" }).notNull(),
    nights: integer("nights")
      .notNull()
      .generatedAlwaysAs(sql`"check_out" - "check_in"`),
    arrivalTime: time("arrival_time"),
    adults: smallint("adults").notNull().default(1),
    children: smallint("children").notNull().default(0),
    specialRequests: text("special_requests"),
    internalNotes: text("internal_notes"),
    contractSignedAt: timestamp("contract_signed_at", { withTimezone: true }),
    contractUrl: text("contract_url"),
    cancellationPolicyId: text("cancellation_policy_id"),
    promoCodeId: text("promo_code_id"),
    priceOverride: jsonb("price_override").$type<PriceOverride>(),
    /** Total of rooms + extras − discounts, tax included or not per the hotel's tax mode. */
    totalAmount: integer("total_amount").notNull().default(0),
    currency: text("currency").notNull(),
    createdVia: createdViaEnum("created_via").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("reservations", t.hotelId, t.id),
    uniqueIndex("reservations_hotel_reference_key").on(t.hotelId, t.reference),
    tenantFk("reservations_guest_fk", [t.hotelId, t.guestId], [guests.hotelId, guests.id]),
    tenantFk(
      "reservations_cancellation_policy_fk",
      [t.hotelId, t.cancellationPolicyId],
      [cancellationPolicies.hotelId, cancellationPolicies.id],
    ),
    tenantFk(
      "reservations_promo_code_fk",
      [t.hotelId, t.promoCodeId],
      [promoCodes.hotelId, promoCodes.id],
    ),
    index("reservations_hotel_check_in_idx").on(t.hotelId, t.checkIn),
    index("reservations_hotel_check_out_idx").on(t.hotelId, t.checkOut),
    index("reservations_hotel_status_idx").on(t.hotelId, t.status),
    index("reservations_hotel_guest_idx").on(t.hotelId, t.guestId),
    index("reservations_hotel_created_idx").on(t.hotelId, t.createdAt),
    check("reservations_dates_valid", sql`${t.checkOut} > ${t.checkIn}`),
    check("reservations_occupancy_valid", sql`${t.adults} >= 1 and ${t.children} >= 0`),
    check("reservations_total_non_negative", sql`${t.totalAmount} >= 0`),
  ],
);

/**
 * One booked room. `checkIn`/`checkOut` mirror the reservation so availability queries and the
 * no-double-booking exclusion constraint (added in migration 0002) work on this table alone.
 * `isActive` is false once the reservation is cancelled or a no-show, releasing the room.
 */
export const reservationRooms = pgTable(
  "reservation_rooms",
  {
    id: id(),
    hotelId: hotelRef(),
    reservationId: text("reservation_id").notNull(),
    roomTypeId: text("room_type_id").notNull(),
    /** Assigned later; null means the room type is booked but no specific room yet. */
    roomId: text("room_id"),
    ratePlanId: text("rate_plan_id").notNull(),
    checkIn: date("check_in", { mode: "string" }).notNull(),
    checkOut: date("check_out", { mode: "string" }).notNull(),
    nightlyPrices: jsonb("nightly_prices").$type<NightlyPrice[]>().notNull().default([]),
    /** Which of the guest's companions sleep in this room. */
    companionIds: text("companion_ids")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    tenantKey("reservation_rooms", t.hotelId, t.id),
    tenantFk(
      "reservation_rooms_reservation_fk",
      [t.hotelId, t.reservationId],
      [reservations.hotelId, reservations.id],
      "cascade",
    ),
    tenantFk(
      "reservation_rooms_room_type_fk",
      [t.hotelId, t.roomTypeId],
      [roomTypes.hotelId, roomTypes.id],
    ),
    tenantFk("reservation_rooms_room_fk", [t.hotelId, t.roomId], [rooms.hotelId, rooms.id]),
    tenantFk(
      "reservation_rooms_rate_plan_fk",
      [t.hotelId, t.ratePlanId],
      [ratePlans.hotelId, ratePlans.id],
    ),
    index("reservation_rooms_reservation_idx").on(t.hotelId, t.reservationId),
    index("reservation_rooms_type_dates_idx").on(t.hotelId, t.roomTypeId, t.checkIn, t.checkOut),
    check("reservation_rooms_dates_valid", sql`${t.checkOut} > ${t.checkIn}`),
  ],
);

export const reservationExtras = pgTable(
  "reservation_extras",
  {
    id: id(),
    hotelId: hotelRef(),
    reservationId: text("reservation_id").notNull(),
    extraId: text("extra_id").notNull(),
    /** Snapshots, so renaming or repricing the extra later doesn't change this booking. */
    name: text("name").notNull(),
    pricingMode: extraPricingModeEnum("pricing_mode").notNull(),
    taxRateBp: integer("tax_rate_bp").notNull().default(0),
    qty: smallint("qty").notNull().default(1),
    unitPrice: integer("unit_price").notNull(),
    total: integer("total").notNull(),
    ...timestamps(),
  },
  (t) => [
    tenantKey("reservation_extras", t.hotelId, t.id),
    tenantFk(
      "reservation_extras_reservation_fk",
      [t.hotelId, t.reservationId],
      [reservations.hotelId, reservations.id],
      "cascade",
    ),
    tenantFk("reservation_extras_extra_fk", [t.hotelId, t.extraId], [extras.hotelId, extras.id]),
    index("reservation_extras_reservation_idx").on(t.hotelId, t.reservationId),
    check("reservation_extras_qty_positive", sql`${t.qty} >= 1`),
    check("reservation_extras_amounts_non_negative", sql`${t.unitPrice} >= 0 and ${t.total} >= 0`),
  ],
);

/** Append-only: feeds the reservation's activity timeline. */
export const reservationStatusHistory = pgTable(
  "reservation_status_history",
  {
    id: id(),
    hotelId: hotelRef(),
    reservationId: text("reservation_id").notNull(),
    fromStatus: reservationStatusEnum("from_status"),
    toStatus: reservationStatusEnum("to_status").notNull(),
    actorKind: actorKindEnum("actor_kind").notNull(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    tenantKey("reservation_status_history", t.hotelId, t.id),
    tenantFk(
      "reservation_status_history_reservation_fk",
      [t.hotelId, t.reservationId],
      [reservations.hotelId, reservations.id],
      "cascade",
    ),
    index("reservation_status_history_reservation_idx").on(t.hotelId, t.reservationId, t.at),
  ],
);

/** Uploaded files (Vercel Blob). The 15 MB limit is enforced at upload and here. */
export const guestDocuments = pgTable(
  "guest_documents",
  {
    id: id(),
    hotelId: hotelRef(),
    guestId: text("guest_id").notNull(),
    /** Optional: the stay the document belongs to (e.g. a signed contract). */
    reservationId: text("reservation_id"),
    type: documentTypeEnum("type").notNull(),
    blobUrl: text("blob_url").notNull(),
    displayName: text("display_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedByUserId: text("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("guest_documents", t.hotelId, t.id),
    tenantFk(
      "guest_documents_guest_fk",
      [t.hotelId, t.guestId],
      [guests.hotelId, guests.id],
      "cascade",
    ),
    tenantFk(
      "guest_documents_reservation_fk",
      [t.hotelId, t.reservationId],
      [reservations.hotelId, reservations.id],
    ),
    index("guest_documents_guest_idx").on(t.hotelId, t.guestId),
    check("guest_documents_size_limit", sql`${t.sizeBytes} between 1 and 15728640`),
  ],
);
