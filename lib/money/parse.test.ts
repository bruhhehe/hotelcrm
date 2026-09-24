import { describe, expect, it } from "vitest";
import { moneyInputValue, parseMoney, parsePercent, percentInputValue } from "./parse";

describe("parseMoney", () => {
  it("reads pounds and pence exactly", () => {
    expect(parseMoney("12.50")).toBe(1250);
    expect(parseMoney("12.5")).toBe(1250);
    expect(parseMoney("12")).toBe(1200);
    expect(parseMoney("0.07")).toBe(7);
    expect(parseMoney(" £1,234.56 ")).toBe(123456);
    expect(parseMoney("0.29")).toBe(29); // 0.29 × 100 is 28.999… in floating point
  });

  it("rejects junk, too many decimals and (by default) negatives", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("12.345")).toBeNull();
    expect(parseMoney("1.2.3")).toBeNull();
    expect(parseMoney("-5")).toBeNull();
    expect(parseMoney("-5", { allowNegative: true })).toBe(-500);
    expect(parseMoney("+5", { allowNegative: true })).toBe(500);
  });

  it("round-trips through the field value", () => {
    for (const minor of [0, 7, 1250, 123456, -1000]) {
      expect(parseMoney(moneyInputValue(minor), { allowNegative: true })).toBe(minor);
    }
  });
});

describe("parsePercent", () => {
  it("reads whole and fractional percentages as basis points", () => {
    expect(parsePercent("20")).toBe(2000);
    expect(parsePercent("12.5%")).toBe(1250);
    expect(parsePercent("0.25")).toBe(25);
    expect(parsePercent("-10", { allowNegative: true })).toBe(-1000);
    expect(parsePercent("-10")).toBeNull();
    expect(parsePercent("1.234")).toBeNull();
  });

  it("round-trips through the field value", () => {
    expect(percentInputValue(2000)).toBe("20");
    expect(percentInputValue(1250)).toBe("12.5");
    expect(percentInputValue(25)).toBe("0.25");
    expect(percentInputValue(-1000)).toBe("-10");
    for (const bp of [0, 5, 25, 1250, 2000, -1000]) {
      expect(parsePercent(percentInputValue(bp), { allowNegative: true })).toBe(bp);
    }
  });
});
