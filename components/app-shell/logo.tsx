import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: "/" | "/dashboard" }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-11 items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" aria-hidden>
          <path
            d="M4 20V9.5L12 4l8 5.5V20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 20v-5.5h5V20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Lodgely</span>
    </Link>
  );
}
