/**
 * The instant at which a hotel-local wall-clock time occurs, e.g. "15:00 on 2026-09-24 in
 * Europe/London" → 2026-09-24T14:00:00Z. Handles DST; for a time skipped by the spring-forward
 * gap it returns the instant one hour later, as clocks do.
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  if (
    y === undefined ||
    mo === undefined ||
    d === undefined ||
    h === undefined ||
    mi === undefined
  ) {
    throw new RangeError(`Bad date/time: ${date} ${time}`);
  }
  const wallAsUtc = Date.UTC(y, mo - 1, d, h, mi);
  // The offset can differ between the guess and the result around DST changes; two passes settle it.
  let instant = wallAsUtc - offsetMs(new Date(wallAsUtc), timeZone);
  instant = wallAsUtc - offsetMs(new Date(instant), timeZone);
  return new Date(instant);
}

/** How far the zone's wall clock is ahead of UTC at `at`, in ms. */
export function offsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  const wall = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return wall - Math.floor(at.getTime() / 1000) * 1000;
}
