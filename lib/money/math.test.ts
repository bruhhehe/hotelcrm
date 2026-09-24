import { describe, expect, it } from "vitest";
import { divRound, formatMoney, percentOf, taxFromInclusive, taxOnTop } from "./math";

describe("divRound", () => {
  it("rounds halves away from zero", () => {
    expect(divRound(5, 2)).toBe(3);
    expect(divRound(-5, 2)).toBe(-3);
    expect(divRound(4, 3)).toBe(1);
    expect(divRound(5, 3)).toBe(2);
  });

  it("refuses non-integers and bad denominators", () => {
    expect(() => divRound(1.5, 2)).toThrow(RangeError);
    expect(() => divRound(1, 0)).toThrow(RangeError);
  });
});

describe("percentOf", () => {
  it("computes a 30% deposit to the penny", () => {
    expect(percentOf(12345, 3000)).toBe(3704); // 3703.5 → 3704
    expect(percentOf(10000, 3000)).toBe(3000);
  });

  it("handles refunds (negative amounts) symmetrically", () => {
    expect(percentOf(-12345, 3000)).toBe(-3704);
  });
});

describe("VAT", () => {
  it("back-calculates 20% VAT from an inclusive price", () => {
    expect(taxFromInclusive(12000, 2000)).toBe(2000); // £120 inc. VAT = £100 + £20
    expect(taxFromInclusive(9500, 2000)).toBe(1583); // 1583.33
    expect(taxFromInclusive(1, 2000)).toBe(0);
  });

  it("adds tax on top for North American hotels", () => {
    expect(taxOnTop(10000, 1300)).toBe(1300);
    expect(taxOnTop(999, 1300)).toBe(130); // 129.87
  });

  it("never loses a penny splitting gross into net + tax", () => {
    for (let gross = 0; gross < 5000; gross += 7) {
      const tax = taxFromInclusive(gross, 2000);
      expect(gross - tax + tax).toBe(gross);
      expect(tax).toBeLessThanOrEqual(gross);
    }
  });
});

describe("formatMoney", () => {
  it("formats minor units in the hotel's currency", () => {
    expect(formatMoney(12345, "GBP")).toBe("£123.45");
    expect(formatMoney(5000, "EUR", "en-GB")).toBe("€50.00");
  });
});
