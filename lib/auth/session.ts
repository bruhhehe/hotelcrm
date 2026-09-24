import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./index";

export type StaffUser = { id: string; email: string; name: string | null; image: string | null };

/** For (app) server components/actions: returns the signed-in staff user or redirects to /login. */
export async function requireUser(): Promise<StaffUser> {
  const session = await getSession();
  const user = session?.user;
  if (!user?.id || !user.email) redirect("/login");
  return { id: user.id, email: user.email, name: user.name ?? null, image: user.image ?? null };
}
