"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { isActivePath, NAV_ITEMS } from "./nav";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      <p className="px-4 pb-2 micro-label">Navigate</p>
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors",
              active
                ? "bg-accent text-foreground before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-primary"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <Icon className={cn("size-[18px]", active && "text-primary")} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-topbar items-center px-6">
        <Logo href="/dashboard" />
      </div>
      <div className="flex-1 overflow-y-auto px-3 pt-6">
        <SidebarNav onNavigate={onNavigate} />
      </div>
      <div className="border-t px-6 py-4 text-xs text-muted-foreground">
        <Link href="/whats-new" onClick={onNavigate} className="hover:text-foreground">
          What&apos;s new in Lodgely
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-sidebar border-r bg-sidebar lg:block">
      <SidebarBody />
    </aside>
  );
}
