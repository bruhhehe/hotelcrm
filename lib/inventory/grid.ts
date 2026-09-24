import { eachNight } from "@/lib/dates/calendar";
import { type NightRate, nightRate, type PriceAdjustmentRow } from "@/lib/pricing/nightly";
import { minStayFor, type NightAvailability, type StayRuleRow } from "./availability";
import { appliesTo, coversDate } from "./date-rules";

/*
 * The Availability grid (spec §4.3): dates across, room types down, each room type showing
 * rooms left and restrictions, and each of its rate plans the price per night. Pure, so the
 * page only loads rows and renders.
 */

export type GridNight = NightAvailability & {
  noArrival: boolean;
  noDeparture: boolean;
  /** Minimum stay for arrivals that night (room-type rules and the hotel default). */
  minNights: number;
};

export type GridPlan = {
  id: string;
  name: string;
  isDefault: boolean;
  nights: NightRate[];
};

export type GridRoomType = {
  id: string;
  name: string;
  physical: number;
  nights: GridNight[];
  plans: GridPlan[];
};

export type GridInput = {
  from: string;
  to: string;
  defaultMinNights: number;
  roomTypes: readonly { id: string; name: string }[];
  ratePlans: readonly {
    id: string;
    roomTypeId: string;
    name: string;
    isDefault: boolean;
    baseNightlyPrice: number;
  }[];
  availability: ReadonlyMap<string, readonly NightAvailability[]>;
  adjustments: readonly PriceAdjustmentRow[];
  rules: readonly StayRuleRow[];
};

export function buildGrid(input: GridInput): GridRoomType[] {
  const dates = eachNight(input.from, input.to);
  return input.roomTypes.map((type) => {
    const availability = input.availability.get(type.id) ?? [];
    const byDate = new Map(availability.map((n) => [n.date, n]));
    const typeRules = input.rules.filter((r) => appliesTo(r, type.id, null));
    const nights: GridNight[] = dates.map((date) => {
      const night = byDate.get(date) ?? {
        date,
        physical: 0,
        outOfOrder: 0,
        capacityCap: null,
        sellable: 0,
        booked: 0,
        closed: false,
        available: 0,
        oversold: 0,
      };
      return {
        ...night,
        noArrival: typeRules.some((r) => r.kind === "closed_to_arrival" && coversDate(r, date)),
        noDeparture: typeRules.some((r) => r.kind === "closed_to_departure" && coversDate(r, date)),
        minNights: minStayFor({
          roomTypeId: type.id,
          ratePlanId: null,
          checkIn: date,
          checkOut: date,
          rules: typeRules,
          defaultMinNights: input.defaultMinNights,
        }).minNights,
      };
    });
    const plans = input.ratePlans
      .filter((p) => p.roomTypeId === type.id)
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        isDefault: plan.isDefault,
        nights: dates.map((date) => nightRate(plan, input.adjustments, date)),
      }));
    return {
      id: type.id,
      name: type.name,
      physical: availability[0]?.physical ?? 0,
      nights,
      plans,
    };
  });
}
