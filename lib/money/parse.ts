/**
 * Parse what staff type into money and percentage fields. Amounts come back in minor units
 * (pence, cents), percentages in basis points; both exact, never via floating point.
 */

const AMOUNT = /^(-)?(\d{1,9})(?:\.(\d{1,2}))?$/;

/** "12.50", "12.5", "12", "£1,234.50" → 1250, 1250, 1200, 123450. Null if not a valid amount. */
export function parseMoney(input: string, { allowNegative = false } = {}): number | null {
  const cleaned = input
    .trim()
    .replace(/[£$€\s,]/g, "")
    .replace(/^\+/, "");
  const m = AMOUNT.exec(cleaned);
  if (!m) return null;
  if (m[1] && !allowNegative) return null;
  const minor = Number(m[2]) * 100 + Number((m[3] ?? "").padEnd(2, "0"));
  return m[1] ? -minor : minor;
}

const PERCENT = /^(-)?(\d{1,5})(?:\.(\d{1,2}))?$/;

/** "20" → 2000, "12.5" → 1250, "-10%" → -1000 (if allowed). Null if not a valid percentage. */
export function parsePercent(input: string, { allowNegative = false } = {}): number | null {
  const cleaned = input.trim().replace(/[%\s]/g, "").replace(/^\+/, "");
  const m = PERCENT.exec(cleaned);
  if (!m) return null;
  if (m[1] && !allowNegative) return null;
  const bp = Number(m[2]) * 100 + Number((m[3] ?? "").padEnd(2, "0"));
  return m[1] ? -bp : bp;
}

/** Minor units back to the plain form a field shows: 1250 → "12.50", -1000 → "-10.00". */
export function moneyInputValue(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Basis points back to a field value: 1250 → "12.5", 2000 → "20". */
export function percentInputValue(bp: number): string {
  const sign = bp < 0 ? "-" : "";
  const abs = Math.abs(bp);
  const frac = abs % 100;
  return `${sign}${Math.floor(abs / 100)}${frac ? `.${String(frac).padStart(2, "0").replace(/0$/, "")}` : ""}`;
}
