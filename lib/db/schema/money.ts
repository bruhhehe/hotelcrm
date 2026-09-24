import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { id, tenantFk, tenantKey, timestamps } from "./_shared";
import { users } from "./auth";
import { invoiceStatusEnum, paymentKindEnum, paymentMethodEnum, taxModeEnum } from "./enums";
import { guestPackages, guests } from "./guests";
import { reservations } from "./reservations";
import { hotelRef } from "./tenancy";

export type InvoiceLine = {
  description: string;
  quantity: number;
  /** Minor units, as charged (tax included or not per `taxMode`). */
  unitAmount: number;
  total: number;
  taxRateBp: number;
  taxMode: "included" | "added_on_top";
  taxAmount: number;
};

/**
 * `number` is assigned only when an invoice is issued, from the hotel's counter inside the same
 * transaction, so numbering is gap-free per hotel. Drafts have no number.
 */
export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    hotelId: hotelRef(),
    reservationId: text("reservation_id"),
    guestId: text("guest_id").notNull(),
    number: integer("number"),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    currency: text("currency").notNull(),
    taxMode: taxModeEnum("tax_mode").notNull().default("included"),
    lines: jsonb("lines").$type<InvoiceLine[]>().notNull().default([]),
    subtotal: integer("subtotal").notNull().default(0),
    taxTotal: integer("tax_total").notNull().default(0),
    discountTotal: integer("discount_total").notNull().default(0),
    total: integer("total").notNull().default(0),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    pdfUrl: text("pdf_url"),
    ...timestamps(),
  },
  (t) => [
    tenantKey("invoices", t.hotelId, t.id),
    uniqueIndex("invoices_hotel_number_key")
      .on(t.hotelId, t.number)
      .where(sql`${t.number} is not null`),
    tenantFk(
      "invoices_reservation_fk",
      [t.hotelId, t.reservationId],
      [reservations.hotelId, reservations.id],
    ),
    tenantFk("invoices_guest_fk", [t.hotelId, t.guestId], [guests.hotelId, guests.id]),
    index("invoices_reservation_idx").on(t.hotelId, t.reservationId),
    check("invoices_number_when_issued", sql`(${t.status} = 'draft') = (${t.number} is null)`),
    check("invoices_amounts_non_negative", sql`${t.total} >= 0 and ${t.taxTotal} >= 0`),
  ],
);

/**
 * Refunds are negative amounts (kind = refund). A payment belongs to a reservation; it is linked
 * to an invoice once one is issued. A package redemption is a `package` payment that points at
 * the guest package it drew from.
 */
export const payments = pgTable(
  "payments",
  {
    id: id(),
    hotelId: hotelRef(),
    reservationId: text("reservation_id").notNull(),
    invoiceId: text("invoice_id"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    method: paymentMethodEnum("method").notNull(),
    kind: paymentKindEnum("kind").notNull(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeRefundId: text("stripe_refund_id"),
    guestPackageId: text("guest_package_id"),
    note: text("note"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    recordedByUserId: text("recorded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (t) => [
    tenantKey("payments", t.hotelId, t.id),
    tenantFk(
      "payments_reservation_fk",
      [t.hotelId, t.reservationId],
      [reservations.hotelId, reservations.id],
    ),
    tenantFk("payments_invoice_fk", [t.hotelId, t.invoiceId], [invoices.hotelId, invoices.id]),
    tenantFk(
      "payments_guest_package_fk",
      [t.hotelId, t.guestPackageId],
      [guestPackages.hotelId, guestPackages.id],
    ),
    index("payments_reservation_idx").on(t.hotelId, t.reservationId),
    index("payments_received_idx").on(t.hotelId, t.receivedAt),
    uniqueIndex("payments_stripe_intent_key")
      .on(t.stripePaymentIntentId)
      .where(sql`${t.stripePaymentIntentId} is not null and ${t.kind} <> 'refund'`),
    check(
      "payments_sign_matches_kind",
      sql`(${t.kind} = 'refund' and ${t.amount} < 0) or (${t.kind} <> 'refund' and ${t.amount} > 0)`,
    ),
    check(
      "payments_package_has_reference",
      sql`${t.method} <> 'package' or ${t.guestPackageId} is not null`,
    ),
  ],
);
