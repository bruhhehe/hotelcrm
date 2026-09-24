import { BedDouble } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { greetingFor, longDate } from "@/lib/format/greeting";
import { firstNameFor } from "@/lib/format/names";

export const metadata: Metadata = { title: "Dashboard" };

// Until hotels exist (Phase 2) there is no hotel timezone to read; London is the demo default.
const DEFAULT_TIMEZONE = "Europe/London";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();

  return (
    <>
      <p className="mb-2 micro-label">{longDate(now, DEFAULT_TIMEZONE)}</p>
      <PageHeader
        title={`${greetingFor(now, DEFAULT_TIMEZONE)}, ${firstNameFor(user.name, user.email)}.`}
        description="Here's what's happening at your hotel today."
      />
      <EmptyState
        icon={BedDouble}
        title="Your hotel isn't set up yet"
        description="Once your rooms, rates and reservations are in Lodgely, today's arrivals, departures, occupancy and revenue will appear here."
      />
    </>
  );
}
