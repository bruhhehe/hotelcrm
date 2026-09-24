import { diffDays, eachNight } from "@/lib/dates/calendar";
import { appliesTo, coversDate, type DateRange, type Scoped } from "./date-rules";

/*
 * Availability engine (spec §6.1). Pure functions over plain rows, so every rule is unit-tested
 * without a database; `lib/inventory/queries.ts` loads the rows and calls these.
 *
 * Nights are calendar dates. A stay from 10 to 12 June occupies the nights of the 10th and 11th:
 * a guest checking out on day D does not occupy night D, so the next guest can arrive that day.
 */

export type RoomStatus = "clean" | "dirty" | "inspected" | "out_of_order";

export type CapacityOverrideRow = DateRange & {
  /** Rooms of the type that may be sold per night while the override applies. */
  roomsAvailable: number;
  label: string;
};

export type StayRuleKind = "closed" | "closed_to_arrival" | "closed_to_departure" | "min_stay";

export type StayRuleRow = DateRange &
  Scoped & {
    kind: StayRuleKind;
    minNights: number | null;
    label: string | null;
  };

/** A booked room holding one unit of a room type over [checkIn, checkOut). */
export type BookedStay = { checkIn: string; checkOut: string };

export type NightAvailability = {
  date: string;
  /** Rooms of this type in the hotel. */
  physical: number;
  /** Rooms out of order that night (counted from today on; the past is history). */
  outOfOrder: number;
  /** Lowest capacity override covering the night, if any. */
  capacityCap: number | null;
  /** Rooms that may be sold: physical − out of order, capped by overrides. */
  sellable: number;
  /** Active bookings holding a room of this type that night. */
  booked: number;
  /** Closed by a stay rule; nothing can be sold. */
  closed: boolean;
  /** What can still be sold: sellable − booked, or 0 when closed. Never negative. */
  available: number;
  /** Bookings beyond sellable (after a room went out of order, say). Staff must move someone. */
  oversold: number;
};

export type AvailabilityInput = {
  roomTypeId: string;
  /** First night (inclusive) and the day after the last night (exclusive). */
  from: string;
  to: string;
  /** Hotel-local today. Out-of-order rooms only reduce availability from today on. */
  today: string;
  rooms: readonly { status: RoomStatus }[];
  capacityOverrides: readonly CapacityOverrideRow[];
  bookings: readonly BookedStay[];
  rules: readonly StayRuleRow[];
};

export function computeAvailability(input: AvailabilityInput): NightAvailability[] {
  const physical = input.rooms.length;
  const outOfOrderNow = input.rooms.filter((r) => r.status === "out_of_order").length;
  const closures = input.rules.filter(
    (r) => r.kind === "closed" && appliesTo(r, input.roomTypeId, null),
  );

  return eachNight(input.from, input.to).map((date) => {
    const outOfOrder = date >= input.today ? outOfOrderNow : 0;
    const caps = input.capacityOverrides.filter((o) => coversDate(o, date));
    // Overlapping overrides: the lowest wins, so no override can open rooms another one closed.
    const capacityCap = caps.length > 0 ? Math.min(...caps.map((o) => o.roomsAvailable)) : null;
    const sellable = Math.max(
      0,
      Math.min(physical - outOfOrder, capacityCap ?? Number.POSITIVE_INFINITY),
    );
    const booked = input.bookings.filter((b) => b.checkIn <= date && date < b.checkOut).length;
    const closed = closures.some((r) => coversDate(r, date));
    return {
      date,
      physical,
      outOfOrder,
      capacityCap,
      sellable,
      booked,
      closed,
      available: closed ? 0 : Math.max(0, sellable - booked),
      oversold: Math.max(0, booked - sellable),
    };
  });
}

// ── Stay rules ───────────────────────────────────────────────────────────────

export type StayViolation =
  | { code: "invalid_dates" }
  | { code: "too_long"; maxNights: number }
  | { code: "closed"; dates: string[]; label: string | null }
  | { code: "closed_to_arrival"; date: string; label: string | null }
  | { code: "closed_to_departure"; date: string; label: string | null }
  | { code: "min_stay"; minNights: number; label: string | null }
  | { code: "over_occupancy"; maxOccupancy: number }
  | { code: "sold_out"; dates: string[] };

/** Longest stay the engine will price or book in one reservation. */
export const MAX_STAY_NIGHTS = 365;

export type StayCheckInput = {
  roomTypeId: string;
  /** The plan being booked; plan-specific rules only apply when it is given. */
  ratePlanId?: string | null;
  checkIn: string;
  checkOut: string;
  rules: readonly StayRuleRow[];
  /** Hotel-wide minimum from settings. */
  defaultMinNights: number;
  /** The rate plan's own minimum. */
  ratePlanMinNights?: number;
  /** Adults + children, checked against the room type's maximum when both are given. */
  guests?: number;
  maxOccupancy?: number;
  /** Per-night availability for the stay, to report sold-out nights. */
  availability?: readonly NightAvailability[];
  /** Rooms wanted of this type (default 1). */
  rooms?: number;
};

/**
 * Minimum stay for an arrival: the highest of the hotel default, the rate plan's own minimum and
 * every min-stay rule covering the arrival date. Minimum stays are judged on the arrival date,
 * the way channel managers treat them (a 3-night minimum over a bank-holiday weekend binds
 * guests arriving that weekend, not guests already in house).
 */
export function minStayFor(input: StayCheckInput): { minNights: number; label: string | null } {
  let best = {
    minNights: Math.max(1, input.defaultMinNights, input.ratePlanMinNights ?? 1),
    label: null as string | null,
  };
  for (const rule of input.rules) {
    if (rule.kind !== "min_stay" || rule.minNights === null) continue;
    if (!appliesTo(rule, input.roomTypeId, input.ratePlanId) || !coversDate(rule, input.checkIn))
      continue;
    if (rule.minNights > best.minNights) best = { minNights: rule.minNights, label: rule.label };
  }
  return best;
}

/**
 * Every reason this stay can't be sold, in the order a guest should hear them. Empty means the
 * dates, rules and (if given) occupancy and availability all allow it.
 */
export function checkStay(input: StayCheckInput): StayViolation[] {
  const nights = diffDays(input.checkIn, input.checkOut);
  if (nights < 1) return [{ code: "invalid_dates" }];
  if (nights > MAX_STAY_NIGHTS) return [{ code: "too_long", maxNights: MAX_STAY_NIGHTS }];

  const violations: StayViolation[] = [];
  const rules = input.rules.filter((r) => appliesTo(r, input.roomTypeId, input.ratePlanId));
  const stayNights = eachNight(input.checkIn, input.checkOut);

  for (const rule of rules.filter((r) => r.kind === "closed")) {
    const dates = stayNights.filter((d) => coversDate(rule, d));
    if (dates.length > 0) violations.push({ code: "closed", dates, label: rule.label });
  }
  const noArrival = rules.find(
    (r) => r.kind === "closed_to_arrival" && coversDate(r, input.checkIn),
  );
  if (noArrival) {
    violations.push({ code: "closed_to_arrival", date: input.checkIn, label: noArrival.label });
  }
  const noDeparture = rules.find(
    (r) => r.kind === "closed_to_departure" && coversDate(r, input.checkOut),
  );
  if (noDeparture) {
    violations.push({
      code: "closed_to_departure",
      date: input.checkOut,
      label: noDeparture.label,
    });
  }
  const min = minStayFor(input);
  if (nights < min.minNights) violations.push({ code: "min_stay", ...min });

  if (input.guests !== undefined && input.maxOccupancy !== undefined) {
    if (input.guests > input.maxOccupancy) {
      violations.push({ code: "over_occupancy", maxOccupancy: input.maxOccupancy });
    }
  }
  if (input.availability) {
    const wanted = input.rooms ?? 1;
    const byDate = new Map(input.availability.map((n) => [n.date, n]));
    // A closed night is already reported as "closed"; sold out means rooms ran out.
    const soldOut = stayNights.filter((d) => {
      const night = byDate.get(d);
      return !night || (!night.closed && night.available < wanted);
    });
    if (soldOut.length > 0) violations.push({ code: "sold_out", dates: soldOut });
  }
  return violations;
}

/** Plain-English reason for staff and guests. `formatDate` renders a YYYY-MM-DD date. */
export function describeViolation(v: StayViolation, formatDate: (date: string) => string): string {
  const suffix = (label: string | null) => (label ? ` (${label})` : "");
  switch (v.code) {
    case "invalid_dates":
      return "Check-out must be after check-in.";
    case "too_long":
      return `Stays can be at most ${v.maxNights} nights. Split longer stays into two reservations.`;
    case "closed":
      return v.dates.length === 1
        ? `We're closed on the night of ${formatDate(v.dates[0]!)}${suffix(v.label)}.`
        : `We're closed on ${v.dates.length} of these nights, from ${formatDate(v.dates[0]!)}${suffix(v.label)}.`;
    case "closed_to_arrival":
      return `Arrivals aren't possible on ${formatDate(v.date)}${suffix(v.label)}.`;
    case "closed_to_departure":
      return `Departures aren't possible on ${formatDate(v.date)}${suffix(v.label)}.`;
    case "min_stay":
      return `Stays arriving then need at least ${v.minNights} ${v.minNights === 1 ? "night" : "nights"}${suffix(v.label)}.`;
    case "over_occupancy":
      return `This room sleeps at most ${v.maxOccupancy} ${v.maxOccupancy === 1 ? "guest" : "guests"}.`;
    case "sold_out":
      return v.dates.length === 1
        ? `No rooms left on the night of ${formatDate(v.dates[0]!)}.`
        : `No rooms left on ${v.dates.length} of these nights, from ${formatDate(v.dates[0]!)}.`;
  }
}
