import Link from "next/link";
import { trialDaysLeft, trialLabel } from "@/lib/billing/trial";
import { cn } from "@/lib/utils";

/** Visible at every width: on a phone the trial countdown matters as much as on desktop. */
export function TrialPill({ trialEndsAt, now = new Date() }: { trialEndsAt: Date; now?: Date }) {
  const days = trialDaysLeft(trialEndsAt, now);
  return (
    <Link
      href="/settings/billing"
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap hover:shadow-pill pointer-fine:min-h-9",
        days <= 3 && "border-warning-border bg-warning text-warning-foreground",
      )}
    >
      {trialLabel(days)}
    </Link>
  );
}
