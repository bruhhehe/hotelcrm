/**
 * Calendar-date arithmetic on "YYYY-MM-DD" strings. Hotel dates (stay nights, seasons) are
 * calendar dates, not instants, so this works in UTC internally and never touches the local
 * timezone of the server.
 */

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toUtcMs(date: string): number {
  const m = ISO_DATE.exec(date);
  if (!m) throw new RangeError(`Not a YYYY-MM-DD date: ${date}`);
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (new Date(ms).toISOString().slice(0, 10) !== date)
    throw new RangeError(`Invalid date: ${date}`);
  return ms;
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** Every night of a stay: check-in inclusive, check-out exclusive. */
export function eachNight(checkIn: string, checkOut: string): string[] {
  const nights = diffDays(checkIn, checkOut);
  return Array.from({ length: Math.max(0, nights) }, (_, i) => addDays(checkIn, i));
}

/** 0 = Monday … 6 = Sunday, matching `price_adjustments.weekday_mask` bit order. */
export function weekdayIndex(date: string): number {
  return (new Date(toUtcMs(date)).getUTCDay() + 6) % 7;
}

/** Half-open ranges [aStart, aEnd) and [bStart, bEnd) share at least one night. */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}
