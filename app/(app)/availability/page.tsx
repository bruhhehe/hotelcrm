import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AccessState } from "@/components/app-shell/access-state";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { addDays, eachNight } from "@/lib/dates/calendar";
import { db } from "@/lib/db";
import { dayMonth, shortDate } from "@/lib/format/dates";
import { currencySymbol, intlLocale } from "@/lib/format/money";
import { can } from "@/lib/auth/permissions";
import { hotelAccess } from "@/lib/hotels/access";
import { GRID_DAYS, loadGrid } from "@/lib/inventory/grid-data";
import { loadHotelBasics } from "@/lib/inventory/queries";
import { gridStartSchema } from "@/lib/inventory/schemas";
import { AvailabilityHeader } from "./availability-header";
import { EditDatesButton, GridEditor } from "./grid-editor";
import { RatesGrid } from "./rates-grid";

export const metadata: Metadata = { title: "Availability" };

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const access = await hotelAccess("inventory.view");
  if (access.status !== "ok") return <AccessState status={access.status} title="Availability" />;
  const { hotel } = access;
  const locale = intlLocale(hotel.locale, hotel.currency);

  const hdb = db.forHotel(hotel.id);
  const basics = await loadHotelBasics(hdb);
  const requested = gridStartSchema.safeParse((await searchParams).from);
  const from = requested.success ? requested.data : basics.today;
  const grid = await loadGrid(hdb, basics, from);
  const dates = eachNight(grid.from, grid.to);
  const lastNight = dates.at(-1)!;
  const canManage = can(access.role, "inventory.manage");
  const oversold = grid.roomTypes.filter((t) => t.nights.some((n) => n.oversold > 0));

  const shift = (days: number) => ({
    pathname: "/availability" as const,
    query: { from: addDays(from, days) },
  });

  return (
    <GridEditor
      enabled={canManage && grid.roomTypes.length > 0}
      roomTypes={grid.roomTypes.map((t) => ({
        id: t.id,
        name: t.name,
        plans: t.plans.map((p) => ({ id: p.id, name: p.name })),
      }))}
      defaultTarget={{
        dateFrom: from,
        dateTo: from,
        roomTypeIds: grid.roomTypes.map((t) => t.id),
      }}
      currencySymbol={currencySymbol(hotel.currency, locale)}
    >
      <AvailabilityHeader actions={<EditDatesButton />} />

      {grid.roomTypes.length === 0 ? (
        <EmptyState
          title="Add rooms to see availability"
          description="Availability and prices build on your room types and rate plans."
          action={
            canManage ? (
              <Button asChild>
                <Link href="/settings/rooms">Set up rooms</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="icon" aria-label="Previous two weeks">
                <Link href={shift(-GRID_DAYS)} scroll={false}>
                  <ChevronLeft />
                </Link>
              </Button>
              <Button asChild variant="outline" size="icon" aria-label="Next two weeks">
                <Link href={shift(GRID_DAYS)} scroll={false}>
                  <ChevronRight />
                </Link>
              </Button>
              <h2 className="ml-2 text-lg font-semibold" aria-live="polite">
                {dayMonth(from, locale)} – {shortDate(lastNight, locale)}
              </h2>
            </div>
            <form className="flex items-center gap-2" action="/availability">
              <label htmlFor="grid-from" className="sr-only">
                Show from date
              </label>
              <Input
                id="grid-from"
                type="date"
                name="from"
                defaultValue={from}
                className="min-h-10 w-auto py-2"
              />
              <Button type="submit" variant="outline" size="sm">
                Go
              </Button>
              {from !== basics.today ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/availability" scroll={false}>
                    Today
                  </Link>
                </Button>
              ) : null}
            </form>
          </div>

          {oversold.length > 0 ? (
            <Banner variant="warning" className="mb-4">
              <p>
                <span className="font-semibold">Oversold:</span>{" "}
                {oversold.map((t) => t.name).join(", ")} {oversold.length === 1 ? "has" : "have"}{" "}
                more bookings than rooms on some nights, usually after a room went out of order.
                Move a booking to another room type.
              </p>
            </Banner>
          ) : null}

          <RatesGrid
            dates={dates}
            today={basics.today}
            roomTypes={grid.roomTypes}
            currency={hotel.currency}
            locale={locale}
          />
        </>
      )}
    </GridEditor>
  );
}
