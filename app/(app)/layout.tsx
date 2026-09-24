import { Sidebar } from "@/components/app-shell/sidebar";
import { SkipLink } from "@/components/app-shell/skip-link";
import { TabBar } from "@/components/app-shell/tab-bar";
import { Topbar } from "@/components/app-shell/topbar";
import { requireUser } from "@/lib/auth/session";
import { getHotelContext } from "@/lib/hotels/current";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const context = await getHotelContext(user.id);

  return (
    <div className="min-h-dvh">
      <SkipLink />
      <Sidebar hotelName={context?.hotel.name ?? null} />
      <div className="lg:pl-sidebar">
        <Topbar user={user} trialEndsAt={context?.hotel.trialEndsAt ?? null} />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 pt-6 pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom)+2.5rem)] focus:outline-none sm:px-6 sm:pt-10 lg:px-10 lg:pb-16"
        >
          {children}
        </main>
      </div>
      <TabBar user={user} hotelName={context?.hotel.name ?? null} />
    </div>
  );
}
