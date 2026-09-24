import { describe, expect, it } from "vitest";
import { currencySymbol, formatPercent, formatPrice, intlLocale } from "./money";

describe("money display", () => {
  it("drops pence on whole prices only", () => {
    expect(formatPrice(12500, "GBP")).toBe("£125");
    expect(formatPrice(12550, "GBP")).toBe("£125.50");
    expect(formatPrice(123456, "GBP")).toBe("£1,234.56");
  });

  it("picks a locale per hotel language and currency", () => {
    expect(intlLocale("en", "GBP")).toBe("en-GB");
    expect(intlLocale("en", "USD")).toBe("en-US");
    expect(intlLocale("fr", "EUR")).toBe("fr-FR");
    expect(formatPrice(9900, "USD", intlLocale("en", "USD"))).toBe("$99");
  });

  it("formats basis points as percentages", () => {
    expect(formatPercent(2000)).toBe("20%");
    expect(formatPercent(1250)).toBe("12.5%");
    expect(formatPercent(-1000)).toBe("-10%");
  });
});

describe("currencySymbol", () => {
  it("gives the symbol for each supported currency", () => {
    expect(currencySymbol("GBP")).toBe("£");
    expect(currencySymbol("EUR", "fr-FR")).toBe("€");
    expect(currencySymbol("USD", "en-US")).toBe("$");
  });
});
