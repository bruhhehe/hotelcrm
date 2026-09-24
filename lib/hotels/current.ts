import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDb } from "@/lib/db";
import { hotels, memberships } from "@/lib/db/schema";
import { isConfigured } from "@/lib/integrations";
import { type HotelSettings, parseHotelSettings } from "./settings";

/** Cookie remembering which hotel a multi-property user last opened (Scale plan). */
export const ACTIVE_HOTEL_COOKIE = "lodgely_hotel";

export type Role = (typeof memberships.$inferSelect)["role"];

export type HotelContext = {
  hotel: Omit<typeof hotels.$inferSelect, "settings"> & { settings: HotelSettings };
  role: Role;
};

/**
 * The hotel the signed-in user is working in: the one in the active-hotel cookie if they're a
 * member of it, otherwise their first membership. Null when they belong to no hotel yet.
 * Memoised per request.
 */
export const getHotelContext = cache(async (userId: string): Promise<HotelContext | null> => {
  if (!isConfigured("database")) return null;
  const rows = await getDb()
    .select({ hotel: hotels, role: memberships.role })
    .from(memberships)
    .innerJoin(hotels, eq(hotels.id, memberships.hotelId))
    .where(and(eq(memberships.userId, userId), isNull(hotels.deletedAt)))
    .orderBy(asc(memberships.createdAt));
  if (rows.length === 0) return null;

  const preferred = (await cookies()).get(ACTIVE_HOTEL_COOKIE)?.value;
  const row = rows.find((r) => r.hotel.id === preferred) ?? rows[0]!;
  return {
    hotel: { ...row.hotel, settings: parseHotelSettings(row.hotel.settings) },
    role: row.role,
  };
});
