import Link from "next/link";
import { trialDaysLeft, trialLabel } from "@/lib/billing/trial";
import { cn } from "@/lib/utils";

export function TrialPill({ trialEndsAt, now = new Date() }: { trialEndsAt: Date; now?: Date }) {
  const days = trialDaysLeft(trialEndsAt, now);
  return (
    <Link
      href="/settings/billing"
      className={cn(
        "hidden rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap sm:inline-flex",
        days <= 3 ? "bg-warning text-warning-foreground" : "bg-primary-soft text-primary",
      )}
    >
      {trialLabel(days)}
    </Link>
  );
}
