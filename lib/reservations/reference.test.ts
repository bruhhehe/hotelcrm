import { describe, expect, it } from "vitest";
import { formatReservationReference } from "./reference";

describe("formatReservationReference", () => {
  it("zero-pads to six digits", () => {
    expect(formatReservationReference(123)).toBe("LDG-000123");
    expect(formatReservationReference(1234567)).toBe("LDG-1234567");
  });

  it("rejects zero and fractions", () => {
    expect(() => formatReservationReference(0)).toThrow(RangeError);
    expect(() => formatReservationReference(1.5)).toThrow(RangeError);
  });
});
