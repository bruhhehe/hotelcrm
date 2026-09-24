import { eq } from "drizzle-orm";
import { afterAll, beforeAll, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { forHotel } from "@/lib/db/tenant";
import { connectTestDb, createTestHotel, describeDb } from "@/test/db";
import { priceStay } from "./queries";

describeDb("priceStay", () => {
  const { db, pool } = connectTestDb();
  let hotelId: string;
  let roomTypeId: string;
  let ratePlanId: string;
  let breakfastId: string;
  let parkingId: string;

  beforeAll(async () => {
    hotelId = (await createTestHotel(db, "Pricing Hotel")).id;
    await db
      .update(schema.hotels)
      .set({ settings: { depositPolicy: { type: "percentage", value: 3000 } } })
      .where(eq(schema.hotels.id, hotelId));
    const h = forHotel(db, hotelId);
    const [vat, zero] = await h
      .insert(schema.taxRates, [
        { name: "VAT 20%", rateBp: 2000, mode: "included", isDefault: true },
        { name: "Zero rated", rateBp: 0, mode: "included" },
      ])
      .returning();
    const [rt] = await h
      .insert(schema.roomTypes, { name: "Classic Double", maxOccupancy: 2 })
      .returning();
    roomTypeId = rt!.id;
    await h.insert(schema.rooms, { roomTypeId, name: "5" });
    const [rp] = await h
      .insert(schema.ratePlans, { roomTypeId, name: "Room only", baseNightlyPrice: 12500 })
      .returning();
    ratePlanId = rp!.id;
    await h.insert(schema.priceAdjustments, [
      {
        dateFrom: "2025-07-01",
        dateTo: "2025-08-31",
        type: "percentage",
        value: 2000,
        label: "Summer season",
        repeatsYearly: true,
      },
      {
        roomTypeId,
        dateFrom: "2026-10-01",
        dateTo: "2026-10-31",
        type: "fixed",
        value: 1000,
        label: "Friday and Saturday",
        weekdayMask: 0b0110000,
      },
    ]);
    const [b, p] = await h
      .insert(schema.extras, [
        {
          name: "Breakfast",
          price: 1450,
          pricingMode: "per_guest_per_night",
          taxRateId: vat!.id,
        },
        { name: "Parking", price: 800, pricingMode: "per_night", taxRateId: zero!.id },
      ])
      .returning();
    breakfastId = b!.id;
    parkingId = p!.id;
    await h.insert(schema.promoCodes, {
      code: "LAKES10",
      type: "percentage",
      value: 1000,
      minNights: 2,
    });
  });

  afterAll(async () => {
    await db.delete(schema.hotels).where(eq(schema.hotels.id, hotelId));
    await pool.end();
  });

  const request = {
    get roomTypeId() {
      return roomTypeId;
    },
    get ratePlanId() {
      return ratePlanId;
    },
    adults: 2,
    children: 0,
  };

  it("prices each night with the adjustments stored in the database", async () => {
    // Thu 1 → Sun 4 October: Thu, Fri, Sat nights.
    const priced = await priceStay(forHotel(db, hotelId), {
      ...request,
      checkIn: "2026-10-01",
      checkOut: "2026-10-04",
    });
    expect(priced.violations).toEqual([]);
    expect(priced.nights.map((n) => n.amount)).toEqual([12500, 13500, 13500]);
    expect(priced.quote?.total).toBe(39500);
    expect(priced.quote?.taxIncluded).toBe(6583);
    expect(priced.quote?.deposit).toBe(11850);
  });

  it("applies a yearly season in a later year", async () => {
    const priced = await priceStay(forHotel(db, hotelId), {
      ...request,
      checkIn: "2027-08-02",
      checkOut: "2027-08-03",
    });
    expect(priced.nights[0]).toMatchObject({
      amount: 15000,
      adjustment: { label: "Summer season" },
    });
  });

  it("adds extras with their own tax rates and matches promo codes in any case", async () => {
    const priced = await priceStay(forHotel(db, hotelId), {
      ...request,
      checkIn: "2026-10-05",
      checkOut: "2026-10-07",
      extras: [{ extraId: breakfastId }, { extraId: parkingId }],
      promoCode: " lakes10 ",
    });
    const q = priced.quote!;
    expect(q.roomsTotal).toBe(25000);
    expect(q.extrasTotal).toBe(5800 + 1600);
    expect(q.discount).toMatchObject({ label: "Promo code LAKES10", amount: 2500 });
    expect(q.total).toBe(29900);
    // VAT on rooms after discount + breakfast; parking zero-rated.
    expect(q.taxes).toEqual([
      { name: "VAT 20%", rateBp: 2000, mode: "included", base: 28300, amount: 4717 },
    ]);
  });

  it("reports an unknown code and a rejected one without discounting", async () => {
    const h = forHotel(db, hotelId);
    const unknown = await priceStay(h, {
      ...request,
      checkIn: "2026-10-05",
      checkOut: "2026-10-07",
      promoCode: "NOPE",
    });
    expect(unknown.unknownPromoCode).toBe("NOPE");
    expect(unknown.quote?.discount).toBeNull();
    const tooShort = await priceStay(h, {
      ...request,
      checkIn: "2026-10-05",
      checkOut: "2026-10-06",
      promoCode: "LAKES10",
    });
    expect(tooShort.quote?.promoRejected).toEqual({ code: "LAKES10", reason: "min_nights" });
  });

  it("still quotes a stay that breaks a rule, and says which", async () => {
    const priced = await priceStay(forHotel(db, hotelId), {
      ...request,
      adults: 3,
      checkIn: "2026-10-05",
      checkOut: "2026-10-06",
    });
    expect(priced.violations).toEqual([{ code: "over_occupancy", maxOccupancy: 2 }]);
    expect(priced.quote?.total).toBe(12500);
  });
});
