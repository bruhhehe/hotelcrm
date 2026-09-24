import "server-only";
import { asc } from "drizzle-orm";
import { addDays } from "@/lib/dates/calendar";
import type { HotelDb } from "@/lib/db/tenant";
import { ratePlans, roomTypes } from "@/lib/db/schema";
import { loadAdjustments } from "@/lib/pricing/queries";
import { buildGrid, type GridRoomType } from "./grid";
import { availabilityByRoomType, type HotelBasics, loadStayRules } from "./queries";

/** Nights shown at once: two weeks, the window hoteliers plan in. */
export const GRID_DAYS = 14;

export type GridData = {
  from: string;
  to: string;
  roomTypes: GridRoomType[];
};

export async function loadGrid(hdb: HotelDb, hotel: HotelBasics, from: string): Promise<GridData> {
  const to = addDays(from, GRID_DAYS);
  const types = await hdb.select(roomTypes, undefined, {
    orderBy: [asc(roomTypes.sortOrder), asc(roomTypes.name)],
  });
  const plans = await hdb.select(ratePlans, undefined, { orderBy: [asc(ratePlans.createdAt)] });
  const availability = await availabilityByRoomType(hdb, { from, to, today: hotel.today });
  const adjustments = await loadAdjustments(hdb, from, to);
  const rules = await loadStayRules(hdb, from, to);
  return {
    from,
    to,
    roomTypes: buildGrid({
      from,
      to,
      defaultMinNights: hotel.settings.defaultMinNights,
      roomTypes: types,
      ratePlans: plans,
      availability,
      adjustments,
      rules,
    }),
  };
}
