import { pgEnum } from "drizzle-orm/pg-core";

/*
 * Postgres enums for closed sets the spec defines. Adding a value later is a one-line
 * migration (ALTER TYPE … ADD VALUE); removing one is not, so only stable sets live here.
 */

export const planEnum = pgEnum("plan", ["core", "pro", "scale"]);

export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "manager",
  "reception",
  "housekeeping",
  "readonly",
]);

export const roomStatusEnum = pgEnum("room_status", [
  "clean",
  "dirty",
  "inspected",
  "out_of_order",
]);

export const adjustmentTypeEnum = pgEnum("adjustment_type", ["percentage", "fixed", "override"]);

export const availabilityRuleKindEnum = pgEnum("availability_rule_kind", [
  "closed",
  "closed_to_arrival",
  "closed_to_departure",
  "min_stay",
]);

export const extraPricingModeEnum = pgEnum("extra_pricing_mode", [
  "per_booking",
  "per_night",
  "per_guest",
  "per_guest_per_night",
]);

export const extraCategoryEnum = pgEnum("extra_category", [
  "breakfast",
  "parking",
  "spa",
  "pet",
  "late_checkout",
  "transfer",
  "other",
]);

export const packageKindEnum = pgEnum("package_kind", [
  "nights_bundle",
  "gift_card",
  "monthly_pass",
]);

export const guestPackageStatusEnum = pgEnum("guest_package_status", [
  "active",
  "used_up",
  "expired",
  "cancelled",
]);

export const promoTypeEnum = pgEnum("promo_type", ["percentage", "fixed"]);

export const portalStatusEnum = pgEnum("portal_status", ["none", "invited", "active"]);

/** Where a booking (and the guest who made it) came from. */
export const bookingSourceEnum = pgEnum("booking_source", [
  "walk_in",
  "website",
  "phone",
  "ota_booking_com",
  "ota_expedia",
  "ota_airbnb",
  "agency",
  "channel_manager",
  "other",
]);

export const companionRelationshipEnum = pgEnum("companion_relationship", [
  "partner",
  "child",
  "colleague",
  "other",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "id_scan",
  "contract",
  "special_agreement",
  "invoice",
  "other",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending_validation",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
]);

export const createdViaEnum = pgEnum("created_via", ["admin", "widget", "portal", "import"]);

export const actorKindEnum = pgEnum("actor_kind", ["user", "guest", "system"]);

export const taxModeEnum = pgEnum("tax_mode", ["included", "added_on_top"]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "paid",
  "partially_paid",
  "void",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "stripe",
  "cash",
  "card_terminal",
  "bank_transfer",
  "package",
  "voucher",
]);

export const paymentKindEnum = pgEnum("payment_kind", ["deposit", "balance", "full", "refund"]);

export const housekeepingTaskTypeEnum = pgEnum("housekeeping_task_type", [
  "departure_clean",
  "stayover",
  "inspection",
  "maintenance",
]);

export const housekeepingTaskStatusEnum = pgEnum("housekeeping_task_status", [
  "todo",
  "in_progress",
  "done",
]);

export const maintenanceSeverityEnum = pgEnum("maintenance_severity", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "open",
  "in_progress",
  "resolved",
]);

export const messageChannelEnum = pgEnum("message_channel", ["email", "sms", "portal"]);

export const messageDirectionEnum = pgEnum("message_direction", ["outbound", "inbound"]);

export const automationKindEnum = pgEnum("automation_kind", [
  "arrival_reminder",
  "pre_arrival_eta",
  "post_stay_review",
  "guest_inactivity",
]);

export const smsLedgerKindEnum = pgEnum("sms_ledger_kind", [
  "purchase",
  "debit",
  "refund",
  "adjustment",
]);
