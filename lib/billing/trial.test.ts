import { describe, expect, it } from "vitest";
import { TRIAL_LENGTH_DAYS, trialDaysLeft, trialEndsAtFrom, trialLabel } from "./trial";

const now = new Date("2026-09-24T10:00:00Z");

describe("trial", () => {
  it("lasts 30 days", () => {
    expect(TRIAL_LENGTH_DAYS).toBe(30);
    expect(trialDaysLeft(trialEndsAtFrom(now), now)).toBe(30);
  });

  it("rounds partial days up", () => {
    const endsAt = new Date("2026-10-03T09:00:00Z"); // 8 days 23 hours away
    expect(trialDaysLeft(endsAt, now)).toBe(9);
    expect(trialLabel(9)).toBe("9 days left");
  });

  it("shows the final day as 1 day left", () => {
    expect(trialDaysLeft(new Date(now.getTime() + 60_000), now)).toBe(1);
    expect(trialLabel(1)).toBe("1 day left");
  });

  it("never goes negative once the trial has ended", () => {
    expect(trialDaysLeft(new Date("2026-09-01T00:00:00Z"), now)).toBe(0);
    expect(trialDaysLeft(now, now)).toBe(0);
    expect(trialLabel(0)).toBe("Trial ended");
  });
});
