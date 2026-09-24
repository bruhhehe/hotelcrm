import { eachNight } from "@/lib/dates/calendar";
import {
  appliesTo,
  coversDate,
  type DateRange,
  type Scoped,
  weekdayInMask,
} from "@/lib/inventory/date-rules";
import { percentOf } from "@/lib/money/math";

export type AdjustmentType = "percentage" | "fixed" | "override";

/**
 * A price adjustment row. `value` is basis points for "percentage" (-1000 = 10% off), minor
 * units added per night for "fixed" (negative takes off), and the replacement nightly price for
 * "override".
 */
export type PriceAdjustmentRow = DateRange &
  Scoped & {
    id: string;
    type: AdjustmentType;
    value: number;
    label: string;
    weekdayMask: number;
    createdAt: Date;
  };

export type RatePlanPricing = {
  id: string;
  roomTypeId: string;
  baseNightlyPrice: number;
};

export type NightRate = {
  date: string;
  /** The rate plan's base price. */
  base: number;
  /** Price for the night after the winning adjustment. */
  amount: number;
  /** The adjustment that set the price, if any. */
  adjustment: { id: string; label: string; type: AdjustmentType; value: number } | null;
};

const PRECEDENCE: Record<AdjustmentType, number> = { override: 3, fixed: 2, percentage: 1 };

/**
 * One adjustment prices a night. An override beats a fixed amount, which beats a percentage;
 * between two of the same type the one created later wins (ids break exact ties so the
 * result never depends on row order).
 */
export function winningAdjustment<T extends PriceAdjustmentRow>(
  candidates: readonly T[],
): T | null {
  let best: T | null = null;
  for (const a of candidates) {
    if (
      !best ||
      PRECEDENCE[a.type] > PRECEDENCE[best.type] ||
      (PRECEDENCE[a.type] === PRECEDENCE[best.type] &&
        (a.createdAt.getTime() > best.createdAt.getTime() ||
          (a.createdAt.getTime() === best.createdAt.getTime() && a.id > best.id)))
    ) {
      best = a;
    }
  }
  return best;
}

export function applyAdjustment(base: number, adjustment: PriceAdjustmentRow | null): number {
  if (!adjustment) return base;
  switch (adjustment.type) {
    case "override":
      return Math.max(0, adjustment.value);
    case "fixed":
      return Math.max(0, base + adjustment.value);
    case "percentage":
      return Math.max(0, base + percentOf(base, adjustment.value));
  }
}

/** The adjustments that could price `date` for this plan (scope, dates and weekday). */
export function adjustmentsForNight<T extends PriceAdjustmentRow>(
  plan: RatePlanPricing,
  adjustments: readonly T[],
  date: string,
): T[] {
  return adjustments.filter(
    (a) =>
      appliesTo(a, plan.roomTypeId, plan.id) &&
      coversDate(a, date) &&
      weekdayInMask(a.weekdayMask, date),
  );
}

/** Price of one night on a rate plan. */
export function nightRate(
  plan: RatePlanPricing,
  adjustments: readonly PriceAdjustmentRow[],
  date: string,
): NightRate {
  const winner = winningAdjustment(adjustmentsForNight(plan, adjustments, date));
  return {
    date,
    base: plan.baseNightlyPrice,
    amount: applyAdjustment(plan.baseNightlyPrice, winner),
    adjustment: winner
      ? { id: winner.id, label: winner.label, type: winner.type, value: winner.value }
      : null,
  };
}

/** Every night of a stay priced on a rate plan: the breakdown stored on the reservation. */
export function nightlyRates(
  plan: RatePlanPricing,
  adjustments: readonly PriceAdjustmentRow[],
  checkIn: string,
  checkOut: string,
): NightRate[] {
  return eachNight(checkIn, checkOut).map((date) => nightRate(plan, adjustments, date));
}
