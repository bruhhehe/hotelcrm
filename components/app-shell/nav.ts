import {
  BarChart3,
  BedDouble,
  CalendarDays,
  LayoutDashboard,
  type LucideIcon,
  NotebookTabs,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import type { Route } from "next";

export type NavItem = {
  href: Route;
  label: string;
  icon: LucideIcon;
  /** Extra words the ⌘K palette matches on. */
  keywords: string[];
};

/** Sidebar order is part of the spec (§4) — do not reorder. */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["home", "today", "overview"],
  },
  {
    href: "/calendar",
    label: "Calendar",
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
    icon: NotebookTabs,
    keywords: ["bookings", "stays"],
  },
  {
    href: "/housekeeping",
    label: "Housekeeping",
    icon: Sparkles,
    keywords: ["cleaning", "maintenance"],
  },
  { href: "/guests", label: "Guests", icon: Users, keywords: ["customers", "clients", "bookers"] },
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
