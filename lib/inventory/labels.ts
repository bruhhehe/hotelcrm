import { formatPercent, formatPrice } from "@/lib/format/money";
import type { StayRuleKind } from "./availability";
import type { RoomStatus } from "./availability";

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  clean: "Clean",
  dirty: "Dirty",
  inspected: "Inspected",
  out_of_order: "Out of order",
};

export const RULE_KIND_LABEL: Record<StayRuleKind, string> = {
  closed: "Closed",
  closed_to_arrival: "No arrivals",
  closed_to_departure: "No departures",
  min_stay: "Minimum stay",
};

/** "Room 7" for numbered rooms; named ones ("Garden Cottage") stand on their own. */
export function roomName(name: string): string {
  return /^\d/.test(name) ? `Room ${name}` : name;
}

/** "Sleeps 2" or "Sleeps 2–4". */
export function occupancyLabel(base: number, max: number): string {
  return base === max ? `Sleeps ${max}` : `Sleeps ${base}–${max}`;
}

/** What an adjustment does to the nightly price: "+20%", "−£10", "Set to £99". */
export function adjustmentLabel(
  a: { type: "percentage" | "fixed" | "override"; value: number },
  currency: string,
  locale = "en-GB",
): string {
  switch (a.type) {
    case "percentage":
      return `${a.value < 0 ? "−" : "+"}${formatPercent(Math.abs(a.value), locale)}`;
    case "fixed":
      return `${a.value < 0 ? "−" : "+"}${formatPrice(Math.abs(a.value), currency, locale)} a night`;
    case "override":
      return `Set to ${formatPrice(a.value, currency, locale)} a night`;
  }
}

/** A stay rule's effect: "Closed", "Minimum stay 3 nights". */
export function ruleLabel(r: { kind: StayRuleKind; minNights: number | null }): string {
  if (r.kind === "min_stay") {
    const n = r.minNights ?? 1;
    return `Minimum stay ${n} ${n === 1 ? "night" : "nights"}`;
  }
  return RULE_KIND_LABEL[r.kind];
}

/** Who a scoped rule applies to, by name. */
export function scopeLabel(
  scope: { roomTypeId: string | null; ratePlanId: string | null },
  names: { roomTypes: Map<string, string>; ratePlans: Map<string, string> },
): string {
  if (scope.ratePlanId) {
    const plan = names.ratePlans.get(scope.ratePlanId) ?? "A deleted rate plan";
    const type = scope.roomTypeId ? names.roomTypes.get(scope.roomTypeId) : undefined;
    return type ? `${type} · ${plan}` : plan;
  }
  if (scope.roomTypeId) return names.roomTypes.get(scope.roomTypeId) ?? "A deleted room type";
  return "All rooms";
}
