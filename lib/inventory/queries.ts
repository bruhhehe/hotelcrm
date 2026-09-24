import "server-only";
import { and, asc, eq, gt, inArray, isNull, lt, or, type SQL, sql } from "drizzle-orm";
import { db, type HotelDb } from "@/lib/db";
import {
  availabilityRules,
  capacityOverrides,
  hotels,
  ratePlans,
  reservationRooms,
  reservations,
  rooms,
  roomTypes,
} from "@/lib/db/schema";
import { isoDateIn } from "@/lib/format/greeting";
import { parseHotelSettings, type HotelSettings } from "@/lib/hotels/settings";
import {
  type BookedStay,
  checkStay,
  computeAvailability,
  type NightAvailability,
  type StayViolation,
} from "./availability";

/*
 * Database side of the availability engine: loads the rows `computeAvailability` and
 * `checkStay` need, for one hotel, and holds the lock that stops two bookings taking the last
 * room. Everything goes through a hotel-scoped handle.
 */

export type HotelBasics = {
  id: string;
  timezone: string;
  currency: string;
  settings: HotelSettings;
  /** Hotel-local date right now. */
  today: string;
};

export async function loadHotelBasics(hdb: HotelDb, now = new Date()): Promise<HotelBasics> {
  const [hotel] = await hdb.db
    .select({
      id: hotels.id,
      timezone: hotels.timezone,
      currency: hotels.currency,
      settings: hotels.settings,
    })
    .from(hotels)
    .where(eq(hotels.id, hdb.hotelId));
  if (!hotel) throw new Error(`Hotel ${hdb.hotelId} not found`);
  return {
    ...hotel,
    settings: parseHotelSettings(hotel.settings),
    today: isoDateIn(now, hotel.timezone),
  };
}

/** SQL twin of `mayOverlap`: rows that could cover a night in [from, to). */
function rangeCandidates(
  table: typeof availabilityRules | typeof capacityOverrides,
  from: string,
  to: string,
): SQL {
  return or(
    and(eq(table.repeatsYearly, true), lt(table.dateFrom, to)),
    and(lt(table.dateFrom, to), sql`${table.dateTo} >= ${from}`),
  ) as SQL;
}

export function loadStayRules(hdb: HotelDb, from: string, to: string) {
  return hdb.select(availabilityRules, rangeCandidates(availabilityRules, from, to));
}

/**
 * Active booked rooms overlapping [from, to), with the room type they actually use: the assigned
 * room's type when a room is assigned (an upgrade uses the bigger room), otherwise the type booked.
 */
export async function loadBookedStays(
  hdb: HotelDb,
  from: string,
  to: string,
  roomTypeIds?: readonly string[],
): Promise<(BookedStay & { roomTypeId: string })[]> {
  const effectiveType = sql<string>`coalesce(${rooms.roomTypeId}, ${reservationRooms.roomTypeId})`;
  const rows = await hdb.db
    .select({
      roomTypeId: effectiveType,
      checkIn: reservationRooms.checkIn,
      checkOut: reservationRooms.checkOut,
    })
    .from(reservationRooms)
    .innerJoin(
      reservations,
      and(
        eq(reservations.hotelId, reservationRooms.hotelId),
        eq(reservations.id, reservationRooms.reservationId),
      ),
    )
    .leftJoin(
      rooms,
      and(eq(rooms.hotelId, reservationRooms.hotelId), eq(rooms.id, reservationRooms.roomId)),
    )
    .where(
      and(
        hdb.scope(reservationRooms, eq(reservationRooms.isActive, true)),
        isNull(reservations.deletedAt),
        lt(reservationRooms.checkIn, to),
        gt(reservationRooms.checkOut, from),
        roomTypeIds ? inArray(effectiveType, [...roomTypeIds]) : undefined,
      ),
    );
  return rows;
}

export type RoomTypeAvailability = {
  roomTypeId: string;
  nights: NightAvailability[];
};

/**
 * Per-night availability for the given room types (default: all of them) over [from, to).
 * `today` defaults to the hotel's local date.
 */
export async function availabilityByRoomType(
  hdb: HotelDb,
  {
    from,
    to,
    roomTypeIds,
    today,
  }: {
    from: string;
    to: string;
    roomTypeIds?: readonly string[];
    today?: string;
  },
): Promise<Map<string, NightAvailability[]>> {
  const hotelToday = today ?? (await loadHotelBasics(hdb)).today;
  const typeFilter = roomTypeIds ? inArray(roomTypes.id, [...roomTypeIds]) : undefined;
  // Sequential on purpose: inside a transaction every query shares one connection.
  const types = await hdb.select(roomTypes, typeFilter);
  const roomRows = await hdb.select(
    rooms,
    roomTypeIds ? inArray(rooms.roomTypeId, [...roomTypeIds]) : undefined,
  );
  const overrides = await hdb.select(
    capacityOverrides,
    and(
      rangeCandidates(capacityOverrides, from, to),
      roomTypeIds ? inArray(capacityOverrides.roomTypeId, [...roomTypeIds]) : undefined,
    ),
  );
  const rules = await loadStayRules(hdb, from, to);
  const bookings = await loadBookedStays(hdb, from, to, roomTypeIds);

  const result = new Map<string, NightAvailability[]>();
  for (const type of types) {
    result.set(
      type.id,
      computeAvailability({
        roomTypeId: type.id,
        from,
        to,
        today: hotelToday,
        rooms: roomRows.filter((r) => r.roomTypeId === type.id),
        capacityOverrides: overrides.filter((o) => o.roomTypeId === type.id),
        bookings: bookings.filter((b) => b.roomTypeId === type.id),
        rules,
      }),
    );
  }
  return result;
}

/**
 * Spec §6.1: rooms of `roomTypeId` that can still be sold on each night in [from, to).
 * Empty when the room type doesn't exist (or belongs to another hotel).
 */
export async function getAvailability(
  hotelId: string,
  roomTypeId: string,
  from: string,
  to: string,
): Promise<NightAvailability[]> {
  const byType = await availabilityByRoomType(db.forHotel(hotelId), {
    from,
    to,
    roomTypeIds: [roomTypeId],
  });
  return byType.get(roomTypeId) ?? [];
}

/**
 * Serialise bookings of these room types: `SELECT … FOR UPDATE` on their rows, in id order so
 * two transactions locking the same pair can't deadlock. Must run inside a transaction; the
 * lock is held until it commits, so the availability read after it can't go stale.
 */
export async function lockRoomTypes(tx: HotelDb, roomTypeIds: readonly string[]): Promise<void> {
  const ids = [...new Set(roomTypeIds)].sort();
  if (ids.length === 0) return;
  const locked = await tx.db
    .select({ id: roomTypes.id })
    .from(roomTypes)
    .where(tx.scope(roomTypes, inArray(roomTypes.id, ids)))
    .orderBy(asc(roomTypes.id))
    .for("update");
  if (locked.length !== ids.length) throw new Error("Room type not found");
}

export class StayUnavailableError extends Error {
  constructor(readonly violations: StayViolation[]) {
    super(`Stay can't be booked: ${violations.map((v) => v.code).join(", ")}`);
    this.name = "StayUnavailableError";
  }
}

export type StayRequest = {
  roomTypeId: string;
  ratePlanId?: string | null;
  checkIn: string;
  checkOut: string;
  /** Rooms wanted of this type. Default 1. */
  rooms?: number;
  guests?: number;
  /**
   * Staff can book through stay rules (a min stay, a closed-to-arrival day) on purpose. Rooms
   * running out is never skippable.
   */
  ignoreRules?: boolean;
};

/** Everything that stops this stay being sold right now, reading current data. */
export async function stayViolations(
  hdb: HotelDb,
  request: StayRequest,
  hotel?: HotelBasics,
): Promise<StayViolation[]> {
  const basics = hotel ?? (await loadHotelBasics(hdb));
  const [type] = await hdb.select(roomTypes, eq(roomTypes.id, request.roomTypeId));
  if (!type) throw new Error("Room type not found");
  const [plan] = request.ratePlanId
    ? await hdb.select(
        ratePlans,
        and(eq(ratePlans.id, request.ratePlanId), eq(ratePlans.roomTypeId, type.id)),
      )
    : [];
  if (request.ratePlanId && !plan) throw new Error("Rate plan not found for this room type");

  if (request.checkOut <= request.checkIn) return [{ code: "invalid_dates" }];
  const rules = await loadStayRules(hdb, request.checkIn, request.checkOut);
  const availability = await availabilityByRoomType(hdb, {
    from: request.checkIn,
    to: request.checkOut,
    roomTypeIds: [type.id],
    today: basics.today,
  });
  const violations = checkStay({
    roomTypeId: type.id,
    ratePlanId: plan?.id ?? null,
    checkIn: request.checkIn,
    checkOut: request.checkOut,
    rules,
    defaultMinNights: basics.settings.defaultMinNights,
    ratePlanMinNights: plan?.minNights,
    guests: request.guests,
    maxOccupancy: type.maxOccupancy,
    availability: availability.get(type.id) ?? [],
    rooms: request.rooms,
  });
  if (!request.ignoreRules) return violations;
  return violations.filter(
    (v) =>
      v.code === "sold_out" ||
      v.code === "invalid_dates" ||
      v.code === "too_long" ||
      v.code === "over_occupancy",
  );
}

/**
 * The booking gate: inside the caller's transaction, lock the room type, re-read availability
 * and throw `StayUnavailableError` unless the stay can be sold. The caller inserts its
 * reservation_rooms in the same transaction, so a second booking waiting on the lock sees them
 * and can't take the same last room.
 */
export async function reserveInventory(tx: HotelDb, request: StayRequest): Promise<void> {
  await lockRoomTypes(tx, [request.roomTypeId]);
  const violations = await stayViolations(tx, request);
  if (violations.length > 0) throw new StayUnavailableError(violations);
}
