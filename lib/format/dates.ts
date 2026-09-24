/**
 * Hotel calendar dates ("YYYY-MM-DD") for display. They are calendar dates, not instants, so
 * they're formatted in UTC and never shift a day with the server's timezone.
 */

function utc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

function fmt(iso: string, options: Intl.DateTimeFormatOptions, locale: string): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(utc(iso));
}

/** "24 Sep 2026" */
export function shortDate(iso: string, locale = "en-GB"): string {
  return fmt(iso, { day: "numeric", month: "short", year: "numeric" }, locale);
}

/** "24 Sep" */
export function dayMonth(iso: string, locale = "en-GB"): string {
  return fmt(iso, { day: "numeric", month: "short" }, locale);
}

/** "Thu" */
export function weekdayShort(iso: string, locale = "en-GB"): string {
  return fmt(iso, { weekday: "short" }, locale);
}

/** "Thu 24 Sep" */
export function weekdayDayMonth(iso: string, locale = "en-GB"): string {
  return `${weekdayShort(iso, locale)} ${dayMonth(iso, locale)}`;
}

/** "September 2026" */
export function monthYear(iso: string, locale = "en-GB"): string {
  return fmt(iso, { month: "long", year: "numeric" }, locale);
}

/**
 * A rule's dates: "24 Dec 2026", "20 Dec 2026 – 5 Jan 2027", or for a yearly rule
 * "1 Jul – 31 Aug, every year".
 */
export function dateRangeLabel(
  from: string,
  to: string,
  { repeatsYearly = false, locale = "en-GB" }: { repeatsYearly?: boolean; locale?: string } = {},
): string {
  if (repeatsYearly) {
    const span =
      from === to ? dayMonth(from, locale) : `${dayMonth(from, locale)} – ${dayMonth(to, locale)}`;
    return `${span}, every year`;
  }
  if (from === to) return shortDate(from, locale);
  if (from.slice(0, 4) === to.slice(0, 4)) {
    return `${dayMonth(from, locale)} – ${shortDate(to, locale)}`;
  }
  return `${shortDate(from, locale)} – ${shortDate(to, locale)}`;
}

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** A weekday mask as words: "" for every day, "Weekends", "Fri, Sat", "Mon–Thu". */
export function weekdayMaskLabel(mask: number): string {
  if ((mask & 127) === 127) return "";
  if (mask === 0b1100000) return "Weekends";
  if (mask === 0b0011111) return "Weekdays";
  const days = WEEKDAY_NAMES.filter((_, i) => mask & (1 << i));
  // A run of three or more consecutive days reads better as a range.
  const indices = WEEKDAY_NAMES.map((_, i) => i).filter((i) => mask & (1 << i));
  const consecutive = indices.every((d, k) => k === 0 || d === indices[k - 1]! + 1);
  if (consecutive && indices.length >= 3) return `${days[0]}–${days.at(-1)}`;
  return days.join(", ");
}

export { WEEKDAY_NAMES };
