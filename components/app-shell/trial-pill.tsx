import Link from "next/link";
import { trialDaysLeft, trialLabel } from "@/lib/billing/trial";
import { cn } from "@/lib/utils";

/** Visible at every width: on a phone the trial countdown matters as much as on desktop. */
export function TrialPill({ trialEndsAt, now = new Date() }: { trialEndsAt: Date; now?: Date }) {
  const days = trialDaysLeft(trialEndsAt, now);
  return (
    <Link
      href="/settings/billing"
      className="inline-flex min-h-11 shrink-0 items-center rounded-full"
    >
      <span
        className={cn(
          "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
          days <= 3 ? "bg-warning text-warning-foreground" : "bg-primary-soft text-primary",
        )}
      >
        {trialLabel(days)}
      </span>
    </Link>
  );
}
