import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { deletedAt, id, tenantFk, tenantKey, timestamps } from "./_shared";
import { users } from "./auth";
import {
  actorKindEnum,
  automationKindEnum,
  housekeepingTaskStatusEnum,
  housekeepingTaskTypeEnum,
  maintenanceSeverityEnum,
  maintenanceStatusEnum,
  messageChannelEnum,
  messageDirectionEnum,
  smsLedgerKindEnum,
} from "./enums";
import { guests } from "./guests";
import { rooms } from "./inventory";
import { reservations } from "./reservations";
import { hotelRef } from "./tenancy";

/** Unique per room, date and type, so the nightly generator is idempotent. */
export const housekeepingTasks = pgTable(
  "housekeeping_tasks",
  {
    id: id(),
    hotelId: hotelRef(),
    roomId: text("room_id").notNull(),
    reservationId: text("reservation_id"),
    date: date("date", { mode: "string" }).notNull(),
    type: housekeepingTaskTypeEnum("type").notNull(),
    status: housekeepingTaskStatusEnum("status").notNull().default("todo"),
    assignedToUserId: text("assigned_to_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    tenantKey("housekeeping_tasks", t.hotelId, t.id),
    tenantFk(
      "housekeeping_tasks_room_fk",
      [t.hotelId, t.roomId],
      [rooms.hotelId, rooms.id],
      "cascade",
    ),
    tenantFk(
      "housekeeping_tasks_reservation_fk",
      [t.hotelId, t.reservationId],
      [reservations.hotelId, reservations.id],
    ),
    uniqueIndex("housekeeping_tasks_room_date_type_key").on(t.hotelId, t.roomId, t.date, t.type),
    index("housekeeping_tasks_hotel_date_idx").on(t.hotelId, t.date),
  ],
);

export const maintenanceIssues = pgTable(
  "maintenance_issues",
  {
    id: id(),
    hotelId: hotelRef(),
    roomId: text("room_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    severity: maintenanceSeverityEnum("severity").notNull().default("medium"),
    status: maintenanceStatusEnum("status").notNull().default("open"),
    photos: text("photos")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    reportedByUserId: text("reported_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    tenantKey("maintenance_issues", t.hotelId, t.id),
    tenantFk(
      "maintenance_issues_room_fk",
      [t.hotelId, t.roomId],
      [rooms.hotelId, rooms.id],
      "cascade",
    ),
    index("maintenance_issues_hotel_status_idx").on(t.hotelId, t.status),
  ],
);

export const guestMessages = pgTable(
  "guest_messages",
  {
    id: id(),
    hotelId: hotelRef(),
    guestId: text("guest_id").notNull(),
    reservationId: text("reservation_id"),
    channel: messageChannelEnum("channel").notNull(),
    direction: messageDirectionEnum("direction").notNull().default("outbound"),
    toAddress: text("to_address"),
    subject: text("subject"),
    body: text("body").notNull(),
    templateKey: text("template_key"),
    /** SMS segments charged against the credit ledger. */
    smsSegments: integer("sms_segments"),
    providerMessageId: text("provider_message_id"),
    sentByUserId: text("sent_by_user_id").references(() => users.id, { onDelete: "set null" }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    error: text("error"),
    ...timestamps(),
  },
  (t) => [
    tenantKey("guest_messages", t.hotelId, t.id),
    tenantFk(
      "guest_messages_guest_fk",
      [t.hotelId, t.guestId],
      [guests.hotelId, guests.id],
      "cascade",
    ),
    tenantFk(
      "guest_messages_reservation_fk",
      [t.hotelId, t.reservationId],
      [reservations.hotelId, reservations.id],
    ),
    index("guest_messages_guest_idx").on(t.hotelId, t.guestId, t.createdAt),
    index("guest_messages_reservation_idx").on(t.hotelId, t.reservationId),
  ],
);

export type AutomationConfig = {
  /** Days relative to arrival (negative = before) or departure, per kind. */
  offsetDays?: number;
  /** Guest inactivity: days without a stay before the win-back sequence starts. */
  thresholdDays?: number;
  /** Guest inactivity: send win-back emails this many days after the threshold. */
  offsets?: number[];
  templateKey?: string;
};

/** Soft-deleted rules stay deleted: the scheduler never resurrects a rule with deleted_at set. */
export const automations = pgTable(
  "automations",
  {
    id: id(),
    hotelId: hotelRef(),
    kind: automationKindEnum("kind").notNull(),
    name: text("name").notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    channels: text("channels")
      .array()
      .notNull()
      .default(sql`'{email}'::text[]`),
    config: jsonb("config").$type<AutomationConfig>().notNull().default({}),
    ...timestamps(),
    deletedAt: deletedAt(),
  },
  (t) => [
    tenantKey("automations", t.hotelId, t.id),
    check("automations_channels_valid", sql`${t.channels} <@ array['email', 'sms']::text[]`),
  ],
);

/** Prepaid SMS credit ledger: the balance is the sum of `credits`. */
export const smsCredits = pgTable(
  "sms_credits",
  {
    id: id(),
    hotelId: hotelRef(),
    kind: smsLedgerKindEnum("kind").notNull(),
    credits: integer("credits").notNull(),
    guestMessageId: text("guest_message_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    tenantKey("sms_credits", t.hotelId, t.id),
    tenantFk(
      "sms_credits_guest_message_fk",
      [t.hotelId, t.guestMessageId],
      [guestMessages.hotelId, guestMessages.id],
    ),
    index("sms_credits_hotel_idx").on(t.hotelId, t.createdAt),
    check(
      "sms_credits_sign_matches_kind",
      sql`(${t.kind} in ('purchase', 'refund') and ${t.credits} > 0) or (${t.kind} = 'debit' and ${t.credits} < 0) or ${t.kind} = 'adjustment'`,
    ),
  ],
);

/** In-app bell. Turning off a team email never removes these. */
export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    hotelId: hotelRef(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: jsonb("payload").$type<Record<string, string | number | boolean | null>>().notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    tenantKey("notifications", t.hotelId, t.id),
    index("notifications_user_unread_idx").on(t.userId, t.readAt, t.createdAt),
  ],
);

/** Append-only record of every mutation on money and status. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    hotelId: hotelRef(),
    actorKind: actorKindEnum("actor_kind").notNull(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    changes: jsonb("changes").$type<{ before?: unknown; after?: unknown }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    tenantKey("audit_log", t.hotelId, t.id),
    index("audit_log_entity_idx").on(t.hotelId, t.entityType, t.entityId),
    index("audit_log_hotel_created_idx").on(t.hotelId, t.createdAt),
  ],
);
