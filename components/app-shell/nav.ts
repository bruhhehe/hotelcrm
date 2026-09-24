import {
  BarChart3,
  BedDouble,
  CalendarDays,
  LayoutDashboard,
  type LucideIcon,
  NotebookTabs,
  Settings,
  BrushCleaning,
  Users,
} from "lucide-react";
import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  /** Extra words the ⌘K palette matches on. */
  keywords: string[];
  /** Shown as its own tab in the phone tab bar; the rest live under "Menu". */
  inTabBar?: boolean;
};

/** Sidebar order is part of the spec (§4) — do not reorder. */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    inTabBar: true,
    icon: LayoutDashboard,
    keywords: ["home", "today", "overview"],
  },
  {
    href: "/calendar",
    label: "Calendar",
    inTabBar: true,
    icon: CalendarDays,
    keywords: ["tape chart", "planning"],
  },
  {
    href: "/availability",
    label: "Availability",
    icon: BedDouble,
    keywords: ["rates", "rooms", "prices", "capacity"],
  },
  {
    href: "/reservations",
    label: "Reservations",
    inTabBar: true,
    icon: NotebookTabs,
    keywords: ["bookings", "stays"],
  },
  {
    href: "/housekeeping",
    label: "Housekeeping",
    icon: BrushCleaning,
    keywords: ["cleaning", "maintenance"],
  },
  {
    href: "/guests",
    label: "Guests",
    icon: Users,
    keywords: ["customers", "clients", "bookers"],
    inTabBar: true,
  },
  { href: "/data", label: "Data", icon: BarChart3, keywords: ["analytics", "reports", "exports"] },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    keywords: ["preferences", "team", "billing"],
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const TAB_BAR_ITEMS: readonly NavItem[] = NAV_ITEMS.filter((item) => item.inTabBar);
