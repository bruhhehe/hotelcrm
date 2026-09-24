/**
 * Integer money math. Amounts are minor units (pence, cents); rates are basis points
 * (2000 = 20%). Every division rounds half away from zero, done in integer arithmetic so no
 * floating-point error can move a penny.
 */

/** round(numerator / denominator), halves away from zero. Denominator must be positive. */
export function divRound(numerator: number, denominator: number): number {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator <= 0) {
    throw new RangeError(
      `divRound needs integers and a positive denominator (${numerator}/${denominator})`,
    );
  }
  const sign = numerator < 0 ? -1 : 1;
  const n = Math.abs(numerator);
  const q = Math.floor(n / denominator);
  const r = n - q * denominator;
  return sign * (2 * r >= denominator ? q + 1 : q);
}

/** `amount × bp / 10000`, rounded. E.g. 30% deposit of £123.45 = percentOf(12345, 3000) = 3704. */
export function percentOf(amount: number, bp: number): number {
  return divRound(amount * bp, 10000);
}

/** Tax contained in a tax-inclusive gross amount (UK/EU VAT): gross × r / (1 + r). */
export function taxFromInclusive(gross: number, rateBp: number): number {
  return divRound(gross * rateBp, 10000 + rateBp);
}

/** Tax to add on top of a net amount (North America). */
export function taxOnTop(net: number, rateBp: number): number {
  return percentOf(net, rateBp);
}

/** Format minor units for display, in the hotel's currency and locale. */
export function formatMoney(amount: number, currency: string, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount / 100);
}
