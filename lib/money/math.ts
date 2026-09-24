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

/**
 * Split `amount` across `weights` in proportion, in whole minor units, so the shares always sum
 * to exactly `amount` (largest-remainder method; ties go to the earlier weight). Used to spread a
 * discount over lines with different tax rates. With all-zero weights the whole amount lands on
 * the first share.
 */
export function allocate(amount: number, weights: readonly number[]): number[] {
  if (!Number.isInteger(amount) || weights.some((w) => !Number.isInteger(w) || w < 0)) {
    throw new RangeError("allocate needs an integer amount and non-negative integer weights");
  }
  if (weights.length === 0) {
    if (amount !== 0) throw new RangeError("allocate: nothing to allocate to");
    return [];
  }
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total === 0) return weights.map((_, i) => (i === 0 ? amount : 0));

  // BigInt: amount × weight can pass 2^53 for large stays.
  const sign = amount < 0 ? -1n : 1n;
  const abs = BigInt(Math.abs(amount));
  const sum = BigInt(total);
  const shares = weights.map((w) => (abs * BigInt(w)) / sum);
  const remainders = weights.map((w, i) => ({ i, r: (abs * BigInt(w)) % sum }));
  let left = abs - shares.reduce((s, x) => s + x, 0n);
  remainders.sort((a, b) => (a.r === b.r ? a.i - b.i : a.r > b.r ? -1 : 1));
  for (const { i } of remainders) {
    if (left === 0n) break;
    shares[i] = shares[i]! + 1n;
    left--;
  }
  return shares.map((s) => Number(s * sign));
}

/** Format minor units for display, in the hotel's currency and locale. */
export function formatMoney(amount: number, currency: string, locale = "en-GB"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount / 100);
}
