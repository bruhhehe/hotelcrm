import { ChevronLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

/** "‹ Settings": the way back to a section's index, above a sub-page's title. */
export function BackLink({ href, label }: { href: Route; label: string }) {
  return (
    <Link
      href={href}
      className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold text-muted-foreground hover:text-foreground sm:min-h-9"
    >
      <ChevronLeft className="size-[18px]" aria-hidden />
      {label}
    </Link>
  );
}
