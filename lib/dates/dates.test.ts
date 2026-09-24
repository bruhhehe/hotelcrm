import { describe, expect, it } from "vitest";
import { addDays, diffDays, eachNight, rangesOverlap, weekdayIndex } from "./calendar";
import { offsetMs, zonedTimeToUtc } from "./zoned";

describe("calendar", () => {
  it("adds days across month, year and leap boundaries", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("is unaffected by DST (calendar days, not 24h instants)", () => {
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(diffDays("2026-10-24", "2026-10-27")).toBe(3);
  });

  it("lists the nights of a stay, excluding check-out", () => {
    expect(eachNight("2026-09-24", "2026-09-27")).toEqual([
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
    ]);
    expect(eachNight("2026-09-24", "2026-09-24")).toEqual([]);
  });

  it("numbers weekdays from Monday", () => {
    expect(weekdayIndex("2026-09-21")).toBe(0); // Monday
    expect(weekdayIndex("2026-09-27")).toBe(6); // Sunday
  });

  it("treats stays as half-open: checking out on D frees night D", () => {
    expect(rangesOverlap("2026-09-20", "2026-09-24", "2026-09-24", "2026-09-26")).toBe(false);
    expect(rangesOverlap("2026-09-20", "2026-09-25", "2026-09-24", "2026-09-26")).toBe(true);
  });

  it("rejects malformed and impossible dates", () => {
    expect(() => addDays("2026-9-1", 1)).toThrow(RangeError);
    expect(() => addDays("2026-02-30", 1)).toThrow(RangeError);
  });
});

describe("zonedTimeToUtc", () => {
  it("converts London summer and winter wall-clock times", () => {
    expect(zonedTimeToUtc("2026-07-01", "15:00", "Europe/London").toISOString()).toBe(
      "2026-07-01T14:00:00.000Z",
    );
    expect(zonedTimeToUtc("2026-12-01", "15:00", "Europe/London").toISOString()).toBe(
      "2026-12-01T15:00:00.000Z",
    );
  });

  it("handles other zones", () => {
    expect(zonedTimeToUtc("2026-07-01", "11:00", "America/Toronto").toISOString()).toBe(
      "2026-07-01T15:00:00.000Z",
    );
  });

  it("reports the zone offset", () => {
    expect(offsetMs(new Date("2026-07-01T12:00:00Z"), "Europe/London")).toBe(3_600_000);
    expect(offsetMs(new Date("2026-01-01T12:00:00Z"), "Europe/London")).toBe(0);
  });
});
