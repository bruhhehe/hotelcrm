import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { greetingFor, isoDateIn, longDate } from "@/lib/format/greeting";
import { firstNameFor } from "@/lib/format/names";
import { getHotelContext } from "@/lib/hotels/current";

export const metadata: Metadata = { title: "Dashboard" };

/** Used only when the user belongs to no hotel yet, so there's no hotel timezone to read. */
const FALLBACK_TIMEZONE = "Europe/London";

export default async function DashboardPage() {
  const user = await requireUser();
  const context = await getHotelContext(user.id);
  const timeZone = context?.hotel.timezone ?? FALLBACK_TIMEZONE;
  const now = new Date();

  return (
    <>
      <PageHeader
        size="hero"
        title={`${greetingFor(now, timeZone)}, ${firstNameFor(user.name, user.email)}.`}
        description={
          <>
            <time dateTime={isoDateIn(now, timeZone)}>{longDate(now, timeZone)}</time>
            {context ? (
              <>
                <br />
                Here&apos;s what&apos;s happening at {context.hotel.name} today.
              </>
            ) : null}
          </>
        }
      />
      {context ? (
        <EmptyState
          title="Not available yet"
          description="Today's arrivals, departures, occupancy and revenue will appear here."
        />
      ) : (
        <EmptyState
          title="You're not part of a hotel yet"
          description="Ask your hotel's owner to invite you to Lodgely. Once you accept, your hotel appears here."
        />
      )}
    </>
  );
}
