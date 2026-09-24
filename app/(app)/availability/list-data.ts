import "server-only";
import { asc } from "drizzle-orm";
import type { HotelDb } from "@/lib/db/tenant";
import { ratePlans, rooms, roomTypes } from "@/lib/db/schema";
import type { ScopeOptions } from "./rule-forms";

/** Room types and plans by name, for scope pickers and "applies to" labels. */
export async function loadInventoryNames(hdb: HotelDb) {
  const types = await hdb.select(roomTypes, undefined, {
    orderBy: [asc(roomTypes.sortOrder), asc(roomTypes.name)],
  });
  const plans = await hdb.select(ratePlans, undefined, { orderBy: [asc(ratePlans.createdAt)] });
  const roomRows = await hdb.select(rooms);
  const typeName = new Map(types.map((t) => [t.id, t.name]));
  const scopes: ScopeOptions = {
    roomTypes: types.map((t) => ({ value: `roomType:${t.id}`, label: t.name })),
    ratePlans: types.flatMap((t) =>
      plans
        .filter((p) => p.roomTypeId === t.id)
        .map((p) => ({ value: `ratePlan:${p.id}`, label: `${t.name} · ${p.name}` })),
    ),
  };
  return {
    types: types.map((t) => ({
      id: t.id,
      name: t.name,
      rooms: roomRows.filter((r) => r.roomTypeId === t.id).length,
    })),
    names: { roomTypes: typeName, ratePlans: new Map(plans.map((p) => [p.id, p.name])) },
    scopes,
  };
}

/** Current and upcoming first (by start date), then ones that have ended. */
export function byRelevance<T extends { dateFrom: string; dateTo: string; repeatsYearly: boolean }>(
  rows: T[],
  today: string,
): (T & { ended: boolean })[] {
  return rows
    .map((r) => ({ ...r, ended: !r.repeatsYearly && r.dateTo < today }))
    .sort((a, b) =>
      a.ended !== b.ended
        ? Number(a.ended) - Number(b.ended)
        : a.ended
          ? b.dateFrom.localeCompare(a.dateFrom)
          : a.dateFrom.localeCompare(b.dateFrom),
    );
}
