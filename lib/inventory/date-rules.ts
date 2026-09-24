import { diffDays, weekdayIndex } from "@/lib/dates/calendar";

/**
 * A rule that applies over hotel calendar dates: price adjustments, capacity overrides and stay
 * rules all share this shape. Both ends are inclusive ("2026-07-01" to "2026-08-31" covers
 * every night of July and August).
 */
export type DateRange = {
  dateFrom: string;
  dateTo: string;
  /** Repeat on the same month and day every year, from the first occurrence onward. */
  repeatsYearly: boolean;
};

/** Every day of the week (bit 0 = Monday … bit 6 = Sunday). */
export const ALL_WEEKDAYS = 0b1111111;

/**
 * Does `range` cover `date`? A yearly range matches on month and day, including one that wraps
 * the new year (20 Dec → 5 Jan), and only from its first year on, so "every year from 2026"
 * never reprices 2025. 29 February only matches in leap years.
 */
export function coversDate(range: DateRange, date: string): boolean {
  if (date < range.dateFrom) return false;
  if (!range.repeatsYearly) return date <= range.dateTo;
  // A yearly range as long as a year covers every day.
  if (diffDays(range.dateFrom, range.dateTo) >= 365) return true;
  const from = range.dateFrom.slice(5);
  const to = range.dateTo.slice(5);
  const day = date.slice(5);
  return from <= to ? from <= day && day <= to : day >= from || day <= to;
}

/** Is `date`'s weekday switched on in `mask`? */
export function weekdayInMask(mask: number, date: string): boolean {
  return (mask & (1 << weekdayIndex(date))) !== 0;
}

/**
 * Could a rule with this range cover any night in [from, to)? Used to narrow database reads;
 * yearly rules are always candidates because their month-day may fall in any year.
 */
export function mayOverlap(range: DateRange, from: string, to: string): boolean {
  if (range.repeatsYearly) return range.dateFrom < to;
  return range.dateFrom < to && range.dateTo >= from;
}

/** Scope of a rule: null means "every room type" / "every rate plan". */
export type Scoped = { roomTypeId: string | null; ratePlanId: string | null };

/**
 * Does a scoped rule apply to this room type and (optionally) rate plan? A rule for a specific
 * rate plan never applies when no rate plan is being asked about (plain room availability).
 */
export function appliesTo(rule: Scoped, roomTypeId: string, ratePlanId?: string | null): boolean {
  if (rule.roomTypeId !== null && rule.roomTypeId !== roomTypeId) return false;
  if (rule.ratePlanId !== null && rule.ratePlanId !== ratePlanId) return false;
  return true;
}
