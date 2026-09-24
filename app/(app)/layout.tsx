import { Sidebar } from "@/components/app-shell/sidebar";
import { SkipLink } from "@/components/app-shell/skip-link";
import { Topbar } from "@/components/app-shell/topbar";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh">
      <SkipLink />
      <Sidebar />
      <div className="lg:pl-sidebar">
        {/* trialEndsAt comes from the active hotel once tenancy lands (Phase 2). */}
        <Topbar user={user} trialEndsAt={null} />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl px-4 py-8 focus:outline-none sm:px-6 lg:px-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
