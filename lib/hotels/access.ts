import "server-only";
import { requireUser, type StaffUser } from "@/lib/auth/session";
import { can, type Permission } from "@/lib/auth/permissions";
import { getHotelContext, type HotelContext } from "./current";

export type HotelAccess =
  | ({ status: "ok"; user: StaffUser } & HotelContext)
  | { status: "no-hotel"; user: StaffUser }
  | ({ status: "forbidden"; user: StaffUser } & HotelContext);

/**
 * The signed-in user's hotel, checked against a permission. Redirects to /login when signed
 * out. Pages render the "no-hotel" and "forbidden" states; actions refuse.
 */
export async function hotelAccess(permission: Permission): Promise<HotelAccess> {
  const user = await requireUser();
  const context = await getHotelContext(user.id);
  if (!context) return { status: "no-hotel", user };
  return { status: can(context.role, permission) ? "ok" : "forbidden", user, ...context };
}
