"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Section tabs that are real links (each tab is a URL, so back/forward and sharing work).
 * Underlined like a hosting app's listing tabs; scrolls sideways on narrow phones.
 */
export function TabsNav({
  items,
  label,
  className,
}: {
  items: readonly { href: Route; label: string }[];
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      className={cn("-mx-4 mb-8 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}
    >
      <ul className="flex min-w-max gap-6 border-b">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex min-h-11 items-center border-b-2 text-[15px] font-semibold whitespace-nowrap transition-colors",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
