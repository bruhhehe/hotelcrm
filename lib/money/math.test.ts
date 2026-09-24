import { describe, expect, it } from "vitest";
import { allocate, divRound, formatMoney, percentOf, taxFromInclusive, taxOnTop } from "./math";

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

describe("allocate", () => {
  it("splits in proportion and always sums exactly", () => {
    expect(allocate(1000, [44700, 3000])).toEqual([937, 63]);
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(2, [1, 1, 1])).toEqual([1, 1, 0]);
    for (const amount of [0, 1, 7, 999, 12345]) {
      const shares = allocate(amount, [3, 5, 7, 11]);
      expect(shares.reduce((s, x) => s + x, 0)).toBe(amount);
    }
  });

  it("splits negative amounts symmetrically", () => {
    expect(allocate(-100, [1, 1, 1])).toEqual([-34, -33, -33]);
  });

  it("puts everything on the first share when all weights are zero", () => {
    expect(allocate(500, [0, 0])).toEqual([500, 0]);
    expect(allocate(0, [])).toEqual([]);
  });

  it("stays exact beyond 2^53 intermediate products", () => {
    const shares = allocate(90_000_000_00, [70_000_000_00, 20_000_000_00]);
    expect(shares).toEqual([70_000_000_00, 20_000_000_00]);
  });

  it("refuses fractions, negative weights and an empty target", () => {
    expect(() => allocate(1.5, [1])).toThrow(RangeError);
    expect(() => allocate(1, [-1, 2])).toThrow(RangeError);
    expect(() => allocate(1, [])).toThrow(RangeError);
  });
});
