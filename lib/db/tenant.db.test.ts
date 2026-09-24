import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, expect, it } from "vitest";
import { connectTestDb, createTestHotel, describeDb, pgCode } from "@/test/db";
import * as schema from "./schema";
import { forHotel } from "./tenant";

describeDb("forHotel (tenant isolation) against Postgres", () => {
  const { db, pool } = connectTestDb();
  let hotelA: typeof schema.hotels.$inferSelect;
  let hotelB: typeof schema.hotels.$inferSelect;

  beforeAll(async () => {
    hotelA = await createTestHotel(db, "Hotel A");
    hotelB = await createTestHotel(db, "Hotel B");
  });

  afterAll(async () => {
    await db.delete(schema.hotels).where(inArray(schema.hotels.id, [hotelA.id, hotelB.id]));
    await pool.end();
  });

  it("stamps hotel_id on insert and only returns this hotel's rows", async () => {
    const a = forHotel(db, hotelA.id);
    const b = forHotel(db, hotelB.id);
    await a.insert(schema.guests, { firstName: "Ada", lastName: "A" });
    await b.insert(schema.guests, [
      { firstName: "Bea", lastName: "B" },
      { firstName: "Bo", lastName: "B" },
    ]);

    const aGuests = await a.select(schema.guests);
    const bGuests = await b.select(schema.guests);
    expect(aGuests.map((g) => g.firstName)).toEqual(["Ada"]);
    expect(bGuests.map((g) => g.firstName).sort()).toEqual(["Bea", "Bo"]);
    expect(aGuests.every((g) => g.hotelId === hotelA.id)).toBe(true);
  });

  it("can't update or delete another hotel's rows, even by id", async () => {
    const a = forHotel(db, hotelA.id);
    const b = forHotel(db, hotelB.id);
    const [ada] = await a.select(schema.guests, eq(schema.guests.firstName, "Ada"));
    expect(ada).toBeDefined();

    const updated = await b
      .update(schema.guests, { notes: "hijacked" }, eq(schema.guests.id, ada!.id))
      .returning();
    expect(updated).toHaveLength(0);

    const deleted = await b.delete(schema.guests, eq(schema.guests.id, ada!.id)).returning();
    expect(deleted).toHaveLength(0);

    const [still] = await a.select(schema.guests, eq(schema.guests.id, ada!.id));
    expect(still?.notes).toBeNull();
  });

  it("hides soft-deleted rows unless asked", async () => {
    const a = forHotel(db, hotelA.id);
    const [temp] = await a
      .insert(schema.guests, { firstName: "Temp", lastName: "Guest" })
      .returning();
    await a.softDelete(schema.guests, eq(schema.guests.id, temp!.id));

    expect(await a.select(schema.guests, eq(schema.guests.id, temp!.id))).toHaveLength(0);
    expect(
      await a.select(schema.guests, eq(schema.guests.id, temp!.id), { withDeleted: true }),
    ).toHaveLength(1);
  });

  it("rejects a reservation that points at another hotel's guest (composite FK)", async () => {
    const b = forHotel(db, hotelB.id);
    const [bGuest] = await b.select(schema.guests);
    const a = forHotel(db, hotelA.id);
    const attempt = a.insert(schema.reservations, {
      reference: "LDG-X1",
      guestId: bGuest!.id,
      source: "phone",
      checkIn: "2026-10-01",
      checkOut: "2026-10-03",
      currency: "GBP",
      createdVia: "admin",
    });
    await expect(attempt).rejects.toSatisfy((e) => pgCode(e) === "23503");
  });

  it("computes nights from the dates", async () => {
    const a = forHotel(db, hotelA.id);
    const [guest] = await a.select(schema.guests, eq(schema.guests.firstName, "Ada"));
    const [res] = await a
      .insert(schema.reservations, {
        reference: "LDG-N1",
        guestId: guest!.id,
        source: "website",
        checkIn: "2026-10-01",
        checkOut: "2026-10-04",
        currency: "GBP",
        createdVia: "widget",
      })
      .returning();
    expect(res?.nights).toBe(3);
  });
});

describeDb("no double bookings (exclusion constraint)", () => {
  const { db, pool } = connectTestDb();
  let hotel: typeof schema.hotels.$inferSelect;
  let roomId: string;
  let roomTypeId: string;
  let ratePlanId: string;
  let reservationId: string;

  beforeAll(async () => {
    hotel = await createTestHotel(db, "Constraint Hotel");
    const h = forHotel(db, hotel.id);
    const [rt] = await h.insert(schema.roomTypes, { name: "Double" }).returning();
    const [room] = await h.insert(schema.rooms, { roomTypeId: rt!.id, name: "1" }).returning();
    const [rp] = await h
      .insert(schema.ratePlans, { roomTypeId: rt!.id, name: "Room only", baseNightlyPrice: 10000 })
      .returning();
    const [guest] = await h.insert(schema.guests, { firstName: "G", lastName: "One" }).returning();
    const [res] = await h
      .insert(schema.reservations, {
        reference: "LDG-C1",
        guestId: guest!.id,
        source: "phone",
        checkIn: "2026-11-01",
        checkOut: "2026-11-10",
        currency: "GBP",
        createdVia: "admin",
      })
      .returning();
    roomTypeId = rt!.id;
    roomId = room!.id;
    ratePlanId = rp!.id;
    reservationId = res!.id;
  });

  afterAll(async () => {
    await db.delete(schema.hotels).where(eq(schema.hotels.id, hotel.id));
    await pool.end();
  });

  const stay = (checkIn: string, checkOut: string, isActive = true) => ({
    reservationId,
    roomTypeId,
    roomId,
    ratePlanId,
    checkIn,
    checkOut,
    isActive,
  });

  it("rejects an overlapping active stay in the same room", async () => {
    const h = forHotel(db, hotel.id);
    await h.insert(schema.reservationRooms, stay("2026-11-01", "2026-11-04"));
    await expect(
      h.insert(schema.reservationRooms, stay("2026-11-03", "2026-11-05")),
    ).rejects.toSatisfy((e) => pgCode(e) === "23P01");
  });

  it("allows back-to-back stays: checking out on day D frees night D", async () => {
    const h = forHotel(db, hotel.id);
    await expect(
      h.insert(schema.reservationRooms, stay("2026-11-04", "2026-11-06")),
    ).resolves.toBeDefined();
  });

  it("ignores cancelled (inactive) stays and unassigned rooms", async () => {
    const h = forHotel(db, hotel.id);
    await expect(
      h.insert(schema.reservationRooms, stay("2026-11-01", "2026-11-02", false)),
    ).resolves.toBeDefined();
    await expect(
      h.insert(schema.reservationRooms, { ...stay("2026-11-01", "2026-11-02"), roomId: null }),
    ).resolves.toBeDefined();
  });
});

describeDb("money constraints", () => {
  const { db, pool } = connectTestDb();
  let hotel: typeof schema.hotels.$inferSelect;
  let guestId: string;

  beforeAll(async () => {
    hotel = await createTestHotel(db, "Money Hotel");
    const [g] = await forHotel(db, hotel.id)
      .insert(schema.guests, { firstName: "M", lastName: "Oney" })
      .returning();
    guestId = g!.id;
  });

  afterAll(async () => {
    await db.delete(schema.hotels).where(eq(schema.hotels.id, hotel.id));
    await pool.end();
  });

  it("requires a number exactly when an invoice is not a draft", async () => {
    const h = forHotel(db, hotel.id);
    await expect(
      h.insert(schema.invoices, { guestId, currency: "GBP", status: "issued" }),
    ).rejects.toSatisfy((e) => pgCode(e) === "23514");
    await expect(
      h.insert(schema.invoices, { guestId, currency: "GBP", status: "draft", number: 1 }),
    ).rejects.toSatisfy((e) => pgCode(e) === "23514");
    await expect(
      h.insert(schema.invoices, { guestId, currency: "GBP", status: "issued", number: 1 }),
    ).resolves.toBeDefined();
  });

  it("keeps invoice numbers unique per hotel", async () => {
    const h = forHotel(db, hotel.id);
    await expect(
      h.insert(schema.invoices, { guestId, currency: "GBP", status: "issued", number: 1 }),
    ).rejects.toSatisfy((e) => pgCode(e) === "23505");
  });
});
