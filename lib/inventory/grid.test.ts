import { describe, expect, it } from "vitest";
import { computeAvailability, type StayRuleRow } from "./availability";
import { buildGrid } from "./grid";

describe("availability grid", () => {
  const rule = (over: Partial<StayRuleRow>): StayRuleRow => ({
    kind: "closed",
    roomTypeId: null,
    ratePlanId: null,
    dateFrom: "2026-12-24",
    dateTo: "2026-12-24",
    repeatsYearly: false,
    minNights: null,
    label: null,
    ...over,
  });

  it("puts availability, restrictions and each plan's price on every date", () => {
    const rules = [
      rule({ kind: "closed_to_arrival", dateFrom: "2026-12-25", dateTo: "2026-12-25" }),
      rule({
        kind: "min_stay",
        minNights: 3,
        roomTypeId: "rt",
        dateFrom: "2026-12-23",
        dateTo: "2026-12-23",
      }),
      // Plan-specific rules don't show on the room type row.
      rule({
        kind: "closed_to_departure",
        ratePlanId: "rp_bnb",
        dateFrom: "2026-12-23",
        dateTo: "2026-12-26",
      }),
    ];
    const grid = buildGrid({
      from: "2026-12-23",
      to: "2026-12-26",
      defaultMinNights: 1,
      roomTypes: [{ id: "rt", name: "Classic" }],
      ratePlans: [
        { id: "rp_bnb", roomTypeId: "rt", name: "B&B", isDefault: false, baseNightlyPrice: 14900 },
        {
          id: "rp_ro",
          roomTypeId: "rt",
          name: "Room only",
          isDefault: true,
          baseNightlyPrice: 12500,
        },
        { id: "rp_x", roomTypeId: "other", name: "Other", isDefault: true, baseNightlyPrice: 1 },
      ],
      availability: new Map([
        [
          "rt",
          computeAvailability({
            roomTypeId: "rt",
            from: "2026-12-23",
            to: "2026-12-26",
            today: "2026-09-24",
            rooms: [{ status: "clean" }, { status: "clean" }],
            capacityOverrides: [],
            bookings: [{ checkIn: "2026-12-23", checkOut: "2026-12-25" }],
            rules,
          }),
        ],
      ]),
      adjustments: [
        {
          id: "adj",
          roomTypeId: null,
          ratePlanId: null,
          dateFrom: "2026-12-24",
          dateTo: "2026-12-25",
          repeatsYearly: false,
          weekdayMask: 127,
          type: "percentage",
          value: 5000,
          label: "Christmas",
          createdAt: new Date("2026-01-01"),
        },
      ],
      rules,
    });
    expect(grid).toHaveLength(1);
    const [type] = grid;
    expect(type!.physical).toBe(2);
    expect(type!.nights.map((n) => n.available)).toEqual([1, 1, 2]);
    expect(type!.nights.map((n) => n.noArrival)).toEqual([false, false, true]);
    expect(type!.nights.map((n) => n.noDeparture)).toEqual([false, false, false]);
    expect(type!.nights.map((n) => n.minNights)).toEqual([3, 1, 1]);
    // Default plan first; only this room type's plans.
    expect(type!.plans.map((p) => p.name)).toEqual(["Room only", "B&B"]);
    expect(type!.plans[0]!.nights.map((n) => n.amount)).toEqual([12500, 18750, 18750]);
    expect(type!.plans[0]!.nights[1]!.adjustment?.label).toBe("Christmas");
  });
});
