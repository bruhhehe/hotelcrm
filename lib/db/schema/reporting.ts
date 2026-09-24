import { date, integer, pgTable, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { hotelRef } from "./tenancy";

/** Daily rollup, refreshed by cron and on write. Money in minor units, occupancy in bp. */
export const dailyStats = pgTable(
  "daily_stats",
  {
    hotelId: hotelRef(),
    date: date("date", { mode: "string" }).notNull(),
    occupancyBp: integer("occupancy_bp").notNull().default(0),
    roomsSold: integer("rooms_sold").notNull().default(0),
    roomNightsAvailable: integer("room_nights_available").notNull().default(0),
    revenue: integer("revenue").notNull().default(0),
    adr: integer("adr").notNull().default(0),
    revpar: integer("revpar").notNull().default(0),
    arrivals: integer("arrivals").notNull().default(0),
    departures: integer("departures").notNull().default(0),
    newBookings: integer("new_bookings").notNull().default(0),
    cancellations: integer("cancellations").notNull().default(0),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ name: "daily_stats_pkey", columns: [t.hotelId, t.date] })],
);
