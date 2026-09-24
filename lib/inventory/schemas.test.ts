import { describe, expect, it } from "vitest";
import {
  bulkEditFormSchema,
  capacityOverrideFormSchema,
  priceAdjustmentFormSchema,
  ratePlanFormSchema,
  roomTypeFormSchema,
  scopeSchema,
  scopeValue,
  stayRuleFormSchema,
} from "./schemas";

describe("inventory form schemas", () => {
  it("parses a room type, splitting amenities and rejecting impossible occupancy", () => {
    const ok = roomTypeFormSchema.parse({
      name: " Classic Double ",
      baseOccupancy: "2",
      maxOccupancy: "3",
      amenities: "Wi-Fi, Desk\nWi-Fi,  ",
      isBookableOnline: "on",
    });
    expect(ok).toMatchObject({
      name: "Classic Double",
      baseOccupancy: 2,
      maxOccupancy: 3,
      amenities: ["Wi-Fi", "Desk"],
      isBookableOnline: true,
      description: null,
    });
    const bad = roomTypeFormSchema.safeParse({ name: "X", baseOccupancy: "3", maxOccupancy: "2" });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0]?.path).toEqual(["maxOccupancy"]);
  });

  it("reads a rate plan price in pounds and pence", () => {
    const plan = ratePlanFormSchema.parse({
      roomTypeId: "rt_1",
      name: "B&B",
      baseNightlyPrice: "149.5",
      minNights: "1",
    });
    expect(plan).toMatchObject({
      baseNightlyPrice: 14950,
      includesBreakfast: false,
      isDefault: false,
      cancellationPolicyId: null,
    });
    expect(ratePlanFormSchema.safeParse({ ...plan, baseNightlyPrice: "12.345" }).success).toBe(
      false,
    );
  });

  it("stores price adjustments signed, with a weekday mask", () => {
    const base = {
      label: "Summer",
      dateFrom: "2026-07-01",
      dateTo: "2026-08-31",
      repeatsYearly: "on",
    };
    expect(
      priceAdjustmentFormSchema.parse({ ...base, type: "percentage", amount: "20" }),
    ).toMatchObject({ value: 2000, weekdayMask: 127, repeatsYearly: true, roomTypeId: null });
    expect(
      priceAdjustmentFormSchema.parse({
        ...base,
        type: "fixed",
        direction: "down",
        amount: "10",
        weekdays: ["4", "5"],
        scope: "ratePlan:rp_1",
      }),
    ).toMatchObject({ value: -1000, weekdayMask: 0b0110000, ratePlanId: "rp_1" });
    expect(priceAdjustmentFormSchema.parse({ ...base, type: "override", amount: "99" }).value).toBe(
      9900,
    );
    expect(
      priceAdjustmentFormSchema.safeParse({
        ...base,
        type: "percentage",
        direction: "down",
        amount: "150",
      }).success,
    ).toBe(false);
    expect(
      priceAdjustmentFormSchema.safeParse({
        ...base,
        dateTo: "2026-06-30",
        type: "fixed",
        amount: "5",
      }).success,
    ).toBe(false);
  });

  it("round-trips scopes", () => {
    for (const s of [
      { roomTypeId: null, ratePlanId: null },
      { roomTypeId: "rt_1", ratePlanId: null },
      { roomTypeId: null, ratePlanId: "rp_1" },
    ]) {
      expect(scopeSchema.parse(scopeValue(s))).toEqual(s);
    }
    expect(scopeSchema.safeParse("guest:1").success).toBe(false);
  });

  it("requires nights only for a minimum-stay rule", () => {
    const base = { dateFrom: "2026-12-24", dateTo: "2026-12-26" };
    expect(stayRuleFormSchema.safeParse({ ...base, kind: "min_stay" }).success).toBe(false);
    expect(stayRuleFormSchema.parse({ ...base, kind: "min_stay", minNights: "3" })).toMatchObject({
      minNights: 3,
    });
    expect(stayRuleFormSchema.parse({ ...base, kind: "closed", minNights: "3" }).minNights).toBe(
      null,
    );
  });

  it("allows zero rooms on a capacity override", () => {
    expect(
      capacityOverrideFormSchema.parse({
        roomTypeId: "rt_1",
        dateFrom: "2027-01-04",
        dateTo: "2027-01-31",
        roomsAvailable: "0",
        label: "Closed for refurb",
      }).roomsAvailable,
    ).toBe(0);
  });

  describe("bulk edit", () => {
    const base = {
      dateFrom: "2026-12-20",
      dateTo: "2026-12-27",
      roomTypeIds: ["rt_1", "rt_2"],
      label: "Christmas",
    };

    it("collects every requested change", () => {
      const edit = bulkEditFormSchema.parse({
        ...base,
        rooms: "2",
        priceMode: "up_percent",
        priceAmount: "25",
        minNights: "3",
        closedToArrival: "on",
        repeatsYearly: "on",
      });
      expect(edit).toMatchObject({
        rooms: 2,
        price: { type: "percentage", value: 2500 },
        minNights: 3,
        close: false,
        closedToArrival: true,
        repeatsYearly: true,
        ratePlanId: null,
      });
    });

    it("refuses an edit that changes nothing, or a rate plan across room types", () => {
      expect(bulkEditFormSchema.safeParse(base).success).toBe(false);
      expect(
        bulkEditFormSchema.safeParse({
          ...base,
          ratePlanId: "rp_1",
          priceMode: "set",
          priceAmount: "99",
        }).success,
      ).toBe(false);
      expect(
        bulkEditFormSchema.parse({
          ...base,
          roomTypeIds: "rt_1",
          ratePlanId: "rp_1",
          priceMode: "set",
          priceAmount: "99",
        }).price,
      ).toEqual({ type: "override", value: 9900 });
    });

    it("needs a valid amount for a price change", () => {
      expect(
        bulkEditFormSchema.safeParse({ ...base, priceMode: "down_amount", priceAmount: "0" })
          .success,
      ).toBe(false);
      expect(
        bulkEditFormSchema.parse({ ...base, priceMode: "down_amount", priceAmount: "15" }).price,
      ).toEqual({ type: "fixed", value: -1500 });
    });
  });
});
