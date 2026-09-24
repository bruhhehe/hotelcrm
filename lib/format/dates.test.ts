import { describe, expect, it } from "vitest";
import { dateRangeLabel, dayMonth, shortDate, weekdayDayMonth, weekdayMaskLabel } from "./dates";

describe("hotel date formatting", () => {
  it("formats calendar dates without timezone drift", () => {
    expect(shortDate("2026-09-24")).toMatch(/^24 Sept? 2026$/);
    expect(dayMonth("2026-01-05")).toMatch(/^5 Jan/);
    expect(weekdayDayMonth("2026-09-24")).toMatch(/^Thu 24 Sep/);
  });

  it("labels ranges, collapsing the year when it repeats", () => {
    expect(dateRangeLabel("2026-12-24", "2026-12-24")).toBe("24 Dec 2026");
    expect(dateRangeLabel("2026-07-01", "2026-08-31")).toBe("1 Jul – 31 Aug 2026");
    expect(dateRangeLabel("2026-12-20", "2027-01-05")).toBe("20 Dec 2026 – 5 Jan 2027");
    expect(dateRangeLabel("2026-07-01", "2026-08-31", { repeatsYearly: true })).toBe(
      "1 Jul – 31 Aug, every year",
    );
  });

  it("names weekday masks", () => {
    expect(weekdayMaskLabel(127)).toBe("");
    expect(weekdayMaskLabel(0b1100000)).toBe("Weekends");
    expect(weekdayMaskLabel(0b0011111)).toBe("Weekdays");
    expect(weekdayMaskLabel(0b0110000)).toBe("Fri, Sat");
    expect(weekdayMaskLabel(0b0001111)).toBe("Mon–Thu");
  });
});
