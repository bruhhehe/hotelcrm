"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { isActivePath, NAV_ITEMS } from "./nav";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main">
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors",
                  active
                    ? "bg-muted font-semibold text-foreground"
                    : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop only; phones get the tab bar. */
export function Sidebar({ hotelName }: { hotelName: string | null }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-topbar shrink-0 items-center px-6">
        <Logo href="/dashboard" />
      </div>
      {hotelName ? (
        <p className="truncate px-6 pt-1 text-sm font-semibold" title={hotelName}>
          {hotelName}
        </p>
      ) : null}
      <div className="flex-1 overflow-y-auto px-3 pt-4">
        <SidebarNav />
      </div>
      <div className="border-t px-6 py-3">
        <Link
          href="/whats-new"
          className="inline-flex min-h-9 items-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          What&apos;s new
        </Link>
      </div>
    </aside>
  );
}
