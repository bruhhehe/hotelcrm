"use client";

import { dayMonth, weekdayShort } from "@/lib/format/dates";
import { formatPrice } from "@/lib/format/money";
import type { GridRoomType } from "@/lib/inventory/grid";
import { moneyInputValue } from "@/lib/money/parse";
import { cn } from "@/lib/utils";
import { useGridEditor } from "./grid-editor";

/**
 * The rates-and-availability grid: dates across, each room type's rooms left and restrictions,
 * then each of its rate plans' prices. Managers click any cell to edit that night (it opens
 * "Edit dates" prefilled); everyone else sees the same grid read-only.
 */
export function RatesGrid({
  dates,
  today,
  roomTypes,
  currency,
  locale,
}: {
  dates: string[];
  today: string;
  roomTypes: GridRoomType[];
  currency: string;
  locale: string;
}) {
  const editor = useGridEditor();
  const canManage = editor !== null;
  const edit = (t: Parameters<NonNullable<typeof editor>["edit"]>[0]) => editor?.edit(t);

  return (
    <>
      <div className="-mx-4 overflow-x-auto border-y sm:mx-0 sm:rounded-xl sm:border">
        <table className="w-full border-separate border-spacing-0 text-[15px]">
          <caption className="sr-only">
            Rooms left to sell and prices a night, {dayMonth(dates[0]!, locale)} to{" "}
            {dayMonth(dates.at(-1)!, locale)}
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 min-w-36 border-b bg-card px-4 py-3 text-left text-sm font-semibold text-muted-foreground sm:min-w-44"
              >
                <span className="sr-only">Room type or rate plan</span>
              </th>
              {dates.map((date, i) => {
                const isToday = date === today;
                const showMonth = i === 0 || date.endsWith("-01");
                return (
                  <th
                    key={date}
                    scope="col"
                    className={cn(
                      "min-w-[76px] border-b border-l px-1 py-2.5 text-center font-normal",
                      isWeekend(date) && "bg-muted",
                    )}
                  >
                    <span className="block text-[13px] text-muted-foreground">
                      {weekdayShort(date, locale)}
                    </span>
                    <span
                      className={cn(
                        "mx-auto mt-0.5 flex size-8 items-center justify-center rounded-full font-semibold",
                        isToday && "bg-foreground text-background",
                      )}
                    >
                      {Number(date.slice(8))}
                    </span>
                    <span
                      aria-hidden={!showMonth}
                      className={cn(
                        "block text-[13px] text-muted-foreground",
                        !showMonth && "invisible",
                      )}
                    >
                      {dayMonth(date, locale).split(" ")[1]}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          {roomTypes.map((type) => (
            <tbody key={type.id}>
              <tr>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b bg-card px-4 py-3 text-left align-top"
                >
                  <span className="block font-semibold">{type.name}</span>
                  <span className="block text-sm font-normal text-muted-foreground">
                    Rooms left of {type.physical}
                  </span>
                </th>
                {type.nights.map((night) => {
                  const label = nightLabel(type.name, night, locale);
                  const content = <AvailabilityCell night={night} />;
                  return (
                    <td
                      key={night.date}
                      className={cn(
                        "h-16 border-b border-l p-0 text-center align-middle",
                        isWeekend(night.date) && "bg-muted",
                        night.closed && "bg-destructive-soft",
                      )}
                    >
                      {canManage ? (
                        <button
                          type="button"
                          aria-label={`${label}. Edit`}
                          onClick={() =>
                            edit({
                              dateFrom: night.date,
                              dateTo: night.date,
                              roomTypeIds: [type.id],
                            })
                          }
                          className="flex size-full min-h-16 flex-col items-center justify-center px-1 -outline-offset-2 hover:bg-foreground/5"
                        >
                          {content}
                        </button>
                      ) : (
                        <div className="flex min-h-16 flex-col items-center justify-center px-1">
                          <span aria-hidden className="contents">
                            {content}
                          </span>
                          <span className="sr-only">{label}</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
              {type.plans.length === 0 ? (
                <tr>
                  <td
                    colSpan={dates.length + 1}
                    className="border-b px-4 py-3 text-sm text-muted-foreground"
                  >
                    No rate plans yet, so {type.name} can&apos;t be priced. Add one in Settings →
                    Rates.
                  </td>
                </tr>
              ) : null}
              {type.plans.map((plan) => (
                <tr key={plan.id}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b bg-card py-2.5 pr-4 pl-7 text-left text-sm font-normal text-muted-foreground"
                  >
                    {plan.name}
                  </th>
                  {plan.nights.map((rate) => {
                    const price = formatPrice(rate.amount, currency, locale);
                    const adjusted = rate.adjustment !== null;
                    const label = `${type.name}, ${plan.name}, ${weekdayShort(rate.date, locale)} ${dayMonth(rate.date, locale)}: ${price}${adjusted ? ` (${rate.adjustment!.label})` : ""}`;
                    const content = (
                      <span className={cn("text-sm", adjusted && "font-bold")}>{price}</span>
                    );
                    return (
                      <td
                        key={rate.date}
                        title={adjusted ? rate.adjustment!.label : undefined}
                        className={cn(
                          "h-11 border-b border-l p-0 text-center",
                          isWeekend(rate.date) && "bg-muted",
                        )}
                      >
                        {canManage ? (
                          <button
                            type="button"
                            aria-label={`${label}. Edit`}
                            onClick={() =>
                              edit({
                                dateFrom: rate.date,
                                dateTo: rate.date,
                                roomTypeIds: [type.id],
                                ratePlanId: plan.id,
                                priceAmount: moneyInputValue(rate.amount),
                              })
                            }
                            className="flex size-full min-h-11 items-center justify-center px-1 -outline-offset-2 hover:bg-foreground/5"
                          >
                            {content}
                          </button>
                        ) : (
                          <div className="px-1">
                            <span aria-hidden>{content}</span>
                            <span className="sr-only">{label}</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Numbers are rooms left to sell. Bold prices include a price adjustment.
        {canManage ? " Select a night to change it." : null}
      </p>
    </>
  );
}

function isWeekend(date: string): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

function AvailabilityCell({ night }: { night: GridRoomType["nights"][number] }) {
  if (night.closed) {
    return <span className="text-sm font-semibold text-destructive">Closed</span>;
  }
  const notes = [
    night.minNights > 1 ? `${night.minNights}+ nights` : null,
    night.noArrival ? "No arrivals" : null,
    night.noDeparture ? "No departures" : null,
  ].filter(Boolean);
  return (
    <>
      <span
        className={cn(
          "text-lg leading-none font-semibold",
          night.available === 0 && "text-muted-foreground",
          night.oversold > 0 && "text-destructive",
        )}
      >
        {night.oversold > 0 ? `−${night.oversold}` : night.available}
      </span>
      {notes.map((n) => (
        <span key={n} className="mt-1 block text-xs leading-tight text-muted-foreground">
          {n}
        </span>
      ))}
    </>
  );
}

function nightLabel(
  typeName: string,
  night: GridRoomType["nights"][number],
  locale: string,
): string {
  const when = `${weekdayShort(night.date, locale)} ${dayMonth(night.date, locale)}`;
  const parts = [
    night.closed
      ? "closed"
      : night.oversold > 0
        ? `oversold by ${night.oversold}`
        : `${night.available} of ${night.sellable} rooms left`,
    night.minNights > 1 ? `minimum stay ${night.minNights} nights` : null,
    night.noArrival ? "no arrivals" : null,
    night.noDeparture ? "no departures" : null,
  ].filter(Boolean);
  return `${typeName}, ${when}: ${parts.join(", ")}`;
}
