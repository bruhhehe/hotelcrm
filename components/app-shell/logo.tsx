import Link from "next/link";
import { cn } from "@/lib/utils";

/** House-and-door mark. Stands alone (no tile) so it reads at 20px in the phone header. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} fill="none" aria-hidden>
      <path
        d="M5 14.2 16 5l11 9.2V26a1 1 0 0 1-1 1h-6.5v-7.5h-7V27H6a1 1 0 0 1-1-1V14.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
  compact = false,
}: {
  className?: string;
  href?: "/" | "/dashboard";
  /** Mark only; the accessible name still says Lodgely. */
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={compact ? "Lodgely home" : undefined}
      className={cn("inline-flex min-h-11 items-center gap-1.5 text-primary", className)}
    >
      <LogoMark />
      {compact ? null : <span className="text-[22px] font-extrabold tracking-tight">lodgely</span>}
    </Link>
  );
}
