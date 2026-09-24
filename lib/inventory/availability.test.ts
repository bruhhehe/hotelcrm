import { describe, expect, it } from "vitest";
import {
  type AvailabilityInput,
  checkStay,
  computeAvailability,
  describeViolation,
  minStayFor,
  type StayRuleRow,
} from "./availability";
import { appliesTo, coversDate, mayOverlap, weekdayInMask } from "./date-rules";

const TYPE = "rt_classic";
const PLAN = "rp_bnb";

const base = (over: Partial<AvailabilityInput> = {}): AvailabilityInput => ({
  roomTypeId: TYPE,
  from: "2026-10-01",
  to: "2026-10-05",
  today: "2026-09-24",
  rooms: [{ status: "clean" }, { status: "dirty" }, { status: "inspected" }, { status: "clean" }],
  capacityOverrides: [],
  bookings: [],
  rules: [],
  ...over,
});

const rule = (over: Partial<StayRuleRow>): StayRuleRow => ({
  kind: "closed",
  roomTypeId: null,
  ratePlanId: null,
  dateFrom: "2026-10-01",
  dateTo: "2026-10-01",
  repeatsYearly: false,
  minNights: null,
  label: null,
  ...over,
});

describe("date rules", () => {
  it("covers both ends of a one-off range and nothing outside it", () => {
    const r = { dateFrom: "2026-07-01", dateTo: "2026-08-31", repeatsYearly: false };
    expect(coversDate(r, "2026-06-30")).toBe(false);
    expect(coversDate(r, "2026-07-01")).toBe(true);
    expect(coversDate(r, "2026-08-31")).toBe(true);
    expect(coversDate(r, "2026-09-01")).toBe(false);
    expect(coversDate(r, "2027-07-15")).toBe(false);
  });

  it("repeats yearly from the first year on, never backwards", () => {
    const r = { dateFrom: "2026-07-01", dateTo: "2026-08-31", repeatsYearly: true };
    expect(coversDate(r, "2027-07-15")).toBe(true);
    expect(coversDate(r, "2031-08-31")).toBe(true);
    expect(coversDate(r, "2027-09-01")).toBe(false);
    expect(coversDate(r, "2025-07-15")).toBe(false);
  });

  it("handles a yearly range that wraps the new year", () => {
    const r = { dateFrom: "2026-12-20", dateTo: "2027-01-05", repeatsYearly: true };
    expect(coversDate(r, "2026-12-31")).toBe(true);
    expect(coversDate(r, "2027-01-05")).toBe(true);
    expect(coversDate(r, "2027-12-24")).toBe(true);
    expect(coversDate(r, "2028-01-02")).toBe(true);
    expect(coversDate(r, "2027-01-06")).toBe(false);
    expect(coversDate(r, "2027-12-19")).toBe(false);
  });

  it("treats a yearly range of a year or more as always on", () => {
    const r = { dateFrom: "2026-01-01", dateTo: "2026-12-31", repeatsYearly: true };
    expect(coversDate(r, "2030-06-15")).toBe(true);
  });

  it("matches 29 February only in leap years", () => {
    const r = { dateFrom: "2028-02-29", dateTo: "2028-02-29", repeatsYearly: true };
    expect(coversDate(r, "2032-02-29")).toBe(true);
    expect(coversDate(r, "2029-02-28")).toBe(false);
    expect(coversDate(r, "2029-03-01")).toBe(false);
  });

  it("reads weekday masks from Monday (bit 0) to Sunday (bit 6)", () => {
    const weekends = 0b1100000; // Saturday + Sunday
    expect(weekdayInMask(weekends, "2026-10-03")).toBe(true); // Saturday
    expect(weekdayInMask(weekends, "2026-10-04")).toBe(true); // Sunday
    expect(weekdayInMask(weekends, "2026-10-05")).toBe(false); // Monday
    expect(weekdayInMask(0b0000001, "2026-10-05")).toBe(true);
  });

  it("narrows candidate rows without dropping yearly ones", () => {
    const oneOff = { dateFrom: "2026-10-10", dateTo: "2026-10-12", repeatsYearly: false };
    expect(mayOverlap(oneOff, "2026-10-01", "2026-10-10")).toBe(false);
    expect(mayOverlap(oneOff, "2026-10-01", "2026-10-11")).toBe(true);
    expect(mayOverlap(oneOff, "2026-10-13", "2026-10-20")).toBe(false);
    const yearly = { dateFrom: "2020-07-01", dateTo: "2020-07-31", repeatsYearly: true };
    expect(mayOverlap(yearly, "2026-10-01", "2026-10-05")).toBe(true);
    expect(mayOverlap(yearly, "2019-10-01", "2019-10-05")).toBe(false);
  });

  it("scopes rules to room types and rate plans", () => {
    expect(appliesTo({ roomTypeId: null, ratePlanId: null }, TYPE)).toBe(true);
    expect(appliesTo({ roomTypeId: TYPE, ratePlanId: null }, TYPE)).toBe(true);
    expect(appliesTo({ roomTypeId: "other", ratePlanId: null }, TYPE)).toBe(false);
    expect(appliesTo({ roomTypeId: null, ratePlanId: PLAN }, TYPE, PLAN)).toBe(true);
    expect(appliesTo({ roomTypeId: null, ratePlanId: PLAN }, TYPE)).toBe(false);
    expect(appliesTo({ roomTypeId: null, ratePlanId: PLAN }, TYPE, "rp_other")).toBe(false);
  });
});

describe("computeAvailability", () => {
  it("sells every physical room when nothing is booked", () => {
    const nights = computeAvailability(base());
    expect(nights.map((n) => n.date)).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(nights.every((n) => n.physical === 4 && n.available === 4)).toBe(true);
  });

  it("frees a room on the check-out day: checkout D does not occupy night D", () => {
    const nights = computeAvailability(
      base({ bookings: [{ checkIn: "2026-10-01", checkOut: "2026-10-03" }] }),
    );
    expect(nights.map((n) => n.booked)).toEqual([1, 1, 0, 0]);
    expect(nights.map((n) => n.available)).toEqual([3, 3, 4, 4]);
  });

  it("counts back-to-back and overlapping stays per night", () => {
    const nights = computeAvailability(
      base({
        bookings: [
          { checkIn: "2026-09-28", checkOut: "2026-10-02" },
          { checkIn: "2026-10-02", checkOut: "2026-10-04" },
          { checkIn: "2026-10-01", checkOut: "2026-10-10" },
          { checkIn: "2026-10-05", checkOut: "2026-10-07" },
        ],
      }),
    );
    expect(nights.map((n) => n.booked)).toEqual([2, 2, 2, 1]);
  });

  it("removes out-of-order rooms from today on, not from past nights", () => {
    const rooms = [{ status: "out_of_order" as const }, { status: "clean" as const }];
    const nights = computeAvailability(
      base({ rooms, from: "2026-09-22", to: "2026-09-26", today: "2026-09-24" }),
    );
    expect(nights.map((n) => n.outOfOrder)).toEqual([0, 0, 1, 1]);
    expect(nights.map((n) => n.sellable)).toEqual([2, 2, 1, 1]);
  });

  it("caps sellable rooms with capacity overrides, the lowest winning", () => {
    const nights = computeAvailability(
      base({
        capacityOverrides: [
          {
            dateFrom: "2026-10-02",
            dateTo: "2026-10-03",
            repeatsYearly: false,
            roomsAvailable: 2,
            label: "Renovation",
          },
          {
            dateFrom: "2026-10-03",
            dateTo: "2026-10-03",
            repeatsYearly: false,
            roomsAvailable: 1,
            label: "Staff training",
          },
          {
            dateFrom: "2026-10-04",
            dateTo: "2026-10-04",
            repeatsYearly: false,
            roomsAvailable: 9,
            label: "Can't exceed physical",
          },
        ],
      }),
    );
    expect(nights.map((n) => n.capacityCap)).toEqual([null, 2, 1, 9]);
    expect(nights.map((n) => n.sellable)).toEqual([4, 2, 1, 4]);
  });

  it("applies a yearly capacity override every year", () => {
    const nights = computeAvailability(
      base({
        from: "2027-01-10",
        to: "2027-01-12",
        capacityOverrides: [
          {
            dateFrom: "2026-01-05",
            dateTo: "2026-01-31",
            repeatsYearly: true,
            roomsAvailable: 1,
            label: "January refurb",
          },
        ],
      }),
    );
    expect(nights.map((n) => n.sellable)).toEqual([1, 1]);
  });

  it("reports oversold nights instead of negative availability", () => {
    const nights = computeAvailability(
      base({
        rooms: [{ status: "clean" }, { status: "out_of_order" }],
        from: "2026-10-01",
        to: "2026-10-02",
        bookings: [
          { checkIn: "2026-10-01", checkOut: "2026-10-02" },
          { checkIn: "2026-10-01", checkOut: "2026-10-03" },
        ],
      }),
    );
    expect(nights[0]).toMatchObject({ sellable: 1, booked: 2, available: 0, oversold: 1 });
  });

  it("sells nothing on closed nights, for this room type or hotel-wide", () => {
    const nights = computeAvailability(
      base({
        rules: [
          rule({ dateFrom: "2026-10-02", dateTo: "2026-10-02" }),
          rule({ roomTypeId: TYPE, dateFrom: "2026-10-04", dateTo: "2026-10-04" }),
          rule({ roomTypeId: "other", dateFrom: "2026-10-01", dateTo: "2026-10-01" }),
          // A closure on one rate plan doesn't close the room type.
          rule({ ratePlanId: PLAN, dateFrom: "2026-10-03", dateTo: "2026-10-03" }),
        ],
      }),
    );
    expect(nights.map((n) => n.closed)).toEqual([false, true, false, true]);
    expect(nights.map((n) => n.available)).toEqual([4, 0, 4, 0]);
  });
});

describe("checkStay", () => {
  const stay = (over: Partial<Parameters<typeof checkStay>[0]> = {}) =>
    checkStay({
      roomTypeId: TYPE,
      ratePlanId: PLAN,
      checkIn: "2026-10-01",
      checkOut: "2026-10-03",
      rules: [],
      defaultMinNights: 1,
      ...over,
    });

  it("accepts an ordinary stay", () => {
    expect(stay()).toEqual([]);
  });

  it("rejects backwards, empty and absurdly long stays", () => {
    expect(stay({ checkOut: "2026-10-01" })).toEqual([{ code: "invalid_dates" }]);
    expect(stay({ checkOut: "2026-09-30" })).toEqual([{ code: "invalid_dates" }]);
    expect(stay({ checkOut: "2027-10-03" })).toEqual([{ code: "too_long", maxNights: 365 }]);
  });

  it("rejects a stay over a closed night but not one leaving that morning", () => {
    const rules = [rule({ dateFrom: "2026-10-03", dateTo: "2026-10-04", label: "Wedding" })];
    expect(stay({ rules })).toEqual([]);
    expect(stay({ rules, checkOut: "2026-10-05" })).toEqual([
      { code: "closed", dates: ["2026-10-03", "2026-10-04"], label: "Wedding" },
    ]);
  });

  it("applies closed-to-arrival to the check-in date only", () => {
    const rules = [
      rule({ kind: "closed_to_arrival", dateFrom: "2026-10-02", dateTo: "2026-10-02" }),
    ];
    expect(stay({ rules })).toEqual([]);
    expect(stay({ rules, checkIn: "2026-10-02", checkOut: "2026-10-04" })).toEqual([
      { code: "closed_to_arrival", date: "2026-10-02", label: null },
    ]);
  });

  it("applies closed-to-departure to the check-out date only", () => {
    const rules = [
      rule({ kind: "closed_to_departure", dateFrom: "2026-10-03", dateTo: "2026-10-03" }),
    ];
    expect(stay({ rules })).toEqual([
      { code: "closed_to_departure", date: "2026-10-03", label: null },
    ]);
    expect(stay({ rules, checkOut: "2026-10-04" })).toEqual([]);
  });

  it("takes the highest minimum stay: hotel, rate plan or a rule on the arrival date", () => {
    expect(stay({ defaultMinNights: 3 })).toEqual([
      { code: "min_stay", minNights: 3, label: null },
    ]);
    expect(stay({ ratePlanMinNights: 4 })).toEqual([
      { code: "min_stay", minNights: 4, label: null },
    ]);
    const bankHoliday = rule({
      kind: "min_stay",
      minNights: 3,
      dateFrom: "2026-10-01",
      dateTo: "2026-10-01",
      label: "Bank holiday",
    });
    expect(stay({ rules: [bankHoliday] })).toEqual([
      { code: "min_stay", minNights: 3, label: "Bank holiday" },
    ]);
    // Judged on arrival: arriving the day before isn't bound by it.
    expect(stay({ rules: [bankHoliday], checkIn: "2026-09-30", checkOut: "2026-10-02" })).toEqual(
      [],
    );
  });

  it("only applies a rate plan's min stay rule when booking that plan", () => {
    const planRule = rule({ kind: "min_stay", minNights: 5, ratePlanId: PLAN });
    expect(minStayFor({ ...baseCheck(), rules: [planRule] }).minNights).toBe(5);
    expect(
      minStayFor({ ...baseCheck(), ratePlanId: "rp_room_only", rules: [planRule] }).minNights,
    ).toBe(1);
  });

  it("checks occupancy when it's given", () => {
    expect(stay({ guests: 3, maxOccupancy: 2 })).toEqual([
      { code: "over_occupancy", maxOccupancy: 2 },
    ]);
    expect(stay({ guests: 2, maxOccupancy: 2 })).toEqual([]);
  });

  it("reports sold-out nights from availability, for the rooms wanted", () => {
    const availability = computeAvailability(
      base({
        rooms: [{ status: "clean" }, { status: "clean" }],
        bookings: [{ checkIn: "2026-10-02", checkOut: "2026-10-03" }],
      }),
    );
    expect(stay({ availability })).toEqual([]);
    expect(stay({ availability, rooms: 2 })).toEqual([{ code: "sold_out", dates: ["2026-10-02"] }]);
  });

  it("says why in plain English", () => {
    const fmt = (d: string) => d;
    expect(describeViolation({ code: "min_stay", minNights: 3, label: "Bank holiday" }, fmt)).toBe(
      "Stays arriving then need at least 3 nights (Bank holiday).",
    );
    expect(describeViolation({ code: "sold_out", dates: ["2026-10-02"] }, fmt)).toBe(
      "No rooms left on the night of 2026-10-02.",
    );
  });
});

function baseCheck() {
  return {
    roomTypeId: TYPE,
    ratePlanId: PLAN,
    checkIn: "2026-10-01",
    checkOut: "2026-10-03",
    rules: [] as StayRuleRow[],
    defaultMinNights: 1,
  };
}
