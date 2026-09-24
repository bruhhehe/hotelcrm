import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { forHotel } from "@/lib/db/tenant";
import { connectTestDb, createTestHotel, describeDb } from "@/test/db";
import {
  availabilityByRoomType,
  reserveInventory,
  StayUnavailableError,
  stayViolations,
} from "./queries";

describeDb("availability queries", () => {
  const { db, pool } = connectTestDb(12);
  let hotelId: string;
  let otherHotelId: string;
  let cosy: string;
  let king: string;
  let cosyPlan: string;
  let kingRoom: string;
  let guestId: string;
  let refSeq = 0;

  const TODAY = "2026-09-24";

  async function book(
    tx: ReturnType<typeof forHotel>,
    roomTypeId: string,
    ratePlanId: string,
    checkIn: string,
    checkOut: string,
    roomId: string | null = null,
  ) {
    const [reservation] = await tx
      .insert(schema.reservations, {
        reference: `T-${++refSeq}-${Math.random().toString(36).slice(2, 8)}`,
        guestId,
        source: "phone",
        checkIn,
        checkOut,
        currency: "GBP",
        createdVia: "admin",
      })
      .returning();
    await tx.insert(schema.reservationRooms, {
      reservationId: reservation!.id,
      roomTypeId,
      ratePlanId,
      roomId,
      checkIn,
      checkOut,
    });
    return reservation!.id;
  }

  beforeAll(async () => {
    const hotel = await createTestHotel(db, "Availability Hotel");
    hotelId = hotel.id;
    otherHotelId = (await createTestHotel(db, "Other Hotel")).id;
    const h = forHotel(db, hotelId);
    const [a, b] = await h
      .insert(schema.roomTypes, [
        { name: "Cosy", baseOccupancy: 1, maxOccupancy: 2 },
        { name: "King", baseOccupancy: 2, maxOccupancy: 2 },
      ])
      .returning();
    cosy = a!.id;
    king = b!.id;
    await h.insert(schema.rooms, [
      { roomTypeId: cosy, name: "1" },
      { roomTypeId: cosy, name: "2" },
    ]);
    const [kr] = await h.insert(schema.rooms, { roomTypeId: king, name: "9" }).returning();
    kingRoom = kr!.id;
    const [p1, p2] = await h
      .insert(schema.ratePlans, [
        { roomTypeId: cosy, name: "Room only", baseNightlyPrice: 9500, isDefault: true },
        { roomTypeId: king, name: "Room only", baseNightlyPrice: 16500, isDefault: true },
      ])
      .returning();
    cosyPlan = p1!.id;
    const [g] = await h
      .insert(schema.guests, { firstName: "Test", lastName: "Guest", source: "phone" })
      .returning();
    guestId = g!.id;

    // Another hotel's identical-looking booking must never count here.
    const o = forHotel(db, otherHotelId);
    const [ot] = await o.insert(schema.roomTypes, { name: "Cosy" }).returning();
    await o.insert(schema.rooms, { roomTypeId: ot!.id, name: "1" });
    void p2;
  });

  afterAll(async () => {
    await db.delete(schema.hotels).where(eq(schema.hotels.id, hotelId));
    await db.delete(schema.hotels).where(eq(schema.hotels.id, otherHotelId));
    await pool.end();
  });

  it("counts bookings, frees the check-out night and ignores cancelled rooms", async () => {
    const h = forHotel(db, hotelId);
    await book(h, cosy, cosyPlan, "2026-10-01", "2026-10-03");
    const cancelled = await book(h, cosy, cosyPlan, "2026-10-01", "2026-10-02");
    await h.update(
      schema.reservationRooms,
      { isActive: false },
      eq(schema.reservationRooms.reservationId, cancelled),
    );

    const byType = await availabilityByRoomType(h, {
      from: "2026-10-01",
      to: "2026-10-04",
      today: TODAY,
    });
    expect(byType.get(cosy)!.map((n) => n.available)).toEqual([1, 1, 2]);
    expect(byType.get(king)!.map((n) => n.available)).toEqual([1, 1, 1]);
  });

  it("counts an upgrade against the room it actually uses", async () => {
    const h = forHotel(db, hotelId);
    // Booked as Cosy, put in the King room.
    await book(h, cosy, cosyPlan, "2026-10-10", "2026-10-11", kingRoom);
    const byType = await availabilityByRoomType(h, {
      from: "2026-10-10",
      to: "2026-10-11",
      today: TODAY,
    });
    expect(byType.get(cosy)![0]!.booked).toBe(0);
    expect(byType.get(king)![0]!.booked).toBe(1);
  });

  it("applies capacity overrides and stay rules from the database", async () => {
    const h = forHotel(db, hotelId);
    await h.insert(schema.capacityOverrides, {
      roomTypeId: cosy,
      dateFrom: "2026-01-05",
      dateTo: "2026-01-20",
      roomsAvailable: 1,
      label: "January refurb",
      repeatsYearly: true,
    });
    await h.insert(schema.availabilityRules, {
      kind: "min_stay",
      dateFrom: "2027-01-08",
      dateTo: "2027-01-08",
      minNights: 3,
      label: "Festival",
    });
    const byType = await availabilityByRoomType(h, {
      from: "2027-01-07",
      to: "2027-01-09",
      roomTypeIds: [cosy],
      today: TODAY,
    });
    expect(byType.get(cosy)!.map((n) => n.sellable)).toEqual([1, 1]);
    expect(
      await stayViolations(h, {
        roomTypeId: cosy,
        ratePlanId: cosyPlan,
        checkIn: "2027-01-08",
        checkOut: "2027-01-09",
      }),
    ).toEqual([{ code: "min_stay", minNights: 3, label: "Festival" }]);
    // Staff can book through a rule on purpose, never through a sold-out night.
    expect(
      await stayViolations(h, {
        roomTypeId: cosy,
        checkIn: "2027-01-08",
        checkOut: "2027-01-09",
        ignoreRules: true,
      }),
    ).toEqual([]);
  });

  it("never sells the last room twice, even to concurrent bookings", async () => {
    // King has exactly one room. Ten transactions race for the same night.
    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        db.transaction(async (raw) => {
          const tx = forHotel(raw, hotelId);
          await reserveInventory(tx, {
            roomTypeId: king,
            checkIn: "2026-11-20",
            checkOut: "2026-11-22",
          });
          // Widen the race window: the lock must hold across the gap before the insert.
          await raw.execute(sql`select pg_sleep(0.02)`);
          const kingPlan = (
            await tx.select(schema.ratePlans, eq(schema.ratePlans.roomTypeId, king))
          )[0]!.id;
          return book(tx, king, kingPlan, "2026-11-20", "2026-11-22");
        }),
      ),
    );
    const won = attempts.filter((a) => a.status === "fulfilled");
    const lost = attempts.filter((a) => a.status === "rejected");
    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(9);
    for (const l of lost) {
      const reason = (l as PromiseRejectedResult).reason as unknown;
      expect(reason).toBeInstanceOf(StayUnavailableError);
      expect((reason as StayUnavailableError).violations).toEqual([
        { code: "sold_out", dates: ["2026-11-20", "2026-11-21"] },
      ]);
    }
    const byType = await availabilityByRoomType(forHotel(db, hotelId), {
      from: "2026-11-20",
      to: "2026-11-22",
      roomTypeIds: [king],
      today: TODAY,
    });
    expect(byType.get(king)!.map((n) => n.booked)).toEqual([1, 1]);
  });

  it("lets concurrent bookings share a room type while rooms remain", async () => {
    // Cosy has two rooms: two of three racing bookings succeed.
    const attempts = await Promise.allSettled(
      Array.from({ length: 3 }, () =>
        db.transaction(async (raw) => {
          const tx = forHotel(raw, hotelId);
          await reserveInventory(tx, {
            roomTypeId: cosy,
            checkIn: "2026-12-01",
            checkOut: "2026-12-02",
          });
          return book(tx, cosy, cosyPlan, "2026-12-01", "2026-12-02");
        }),
      ),
    );
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(2);
  });

  it("refuses a room type from another hotel", async () => {
    await expect(
      db.transaction((raw) =>
        reserveInventory(forHotel(raw, otherHotelId), {
          roomTypeId: cosy,
          checkIn: "2026-12-01",
          checkOut: "2026-12-02",
        }),
      ),
    ).rejects.toThrow("Room type not found");
  });
});
