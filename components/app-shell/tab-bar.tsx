"use client";

import { CreditCard, Megaphone, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { StaffUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { isActivePath, NAV_ITEMS, TAB_BAR_ITEMS } from "./nav";
import { SignOutButton } from "./sign-out-item";
import { UserAvatar } from "./user-menu";

const tabClass =
  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold leading-none";

/**
 * Phone navigation, the hosting-app pattern: four sections as tabs, everything else under Menu.
 * Menu opens a bottom sheet with every section in sidebar order plus account actions.
 */
export function TabBar({ user, hotelName }: { user: StaffUser; hotelName: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const inMenu = !TAB_BAR_ITEMS.some((item) => isActivePath(pathname, item.href));

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex h-tabbar">
        {TAB_BAR_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(tabClass, active ? "text-primary" : "text-muted-foreground")}
              >
                <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className={cn(tabClass, inMenu ? "text-primary" : "text-muted-foreground")}
              aria-current={inMenu ? "page" : undefined}
            >
              <Menu className="size-6" strokeWidth={inMenu ? 2.25 : 1.75} aria-hidden />
              Menu
            </SheetTrigger>
            <SheetContent side="bottom" aria-describedby={undefined}>
              <div className="flex items-center gap-3 border-b px-6 py-5 pr-16">
                <UserAvatar user={user} />
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base font-semibold">
                    {user.name ?? "Your account"}
                  </SheetTitle>
                  <p className="truncate text-sm text-muted-foreground">
                    {hotelName ? `${hotelName} · ${user.email}` : user.email}
                  </p>
                </div>
              </div>
              <ul className="px-3 py-3">
                {NAV_ITEMS.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-12 items-center gap-4 rounded-lg px-3 text-base",
                          active ? "bg-muted font-semibold" : "font-medium",
                        )}
                      >
                        <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <ul className="border-t px-3 py-3">
                <li>
                  <Link
                    href="/whats-new"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-12 items-center gap-4 rounded-lg px-3 text-base font-medium"
                  >
                    <Megaphone className="size-[22px]" strokeWidth={1.75} aria-hidden />
                    What&apos;s new
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings/billing"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-12 items-center gap-4 rounded-lg px-3 text-base font-medium"
                  >
                    <CreditCard className="size-[22px]" strokeWidth={1.75} aria-hidden />
                    Billing
                  </Link>
                </li>
                <li>
                  <SignOutButton className="flex min-h-12 w-full items-center gap-4 rounded-lg px-3 text-base font-medium" />
                </li>
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
