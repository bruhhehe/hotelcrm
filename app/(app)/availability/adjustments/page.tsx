import type { Metadata } from "next";
import { AccessState } from "@/components/app-shell/access-state";
import { ConfirmDelete } from "@/components/forms/confirm-delete";
import { Badge } from "@/components/ui/badge";
import {
  DataList,
  DataListActions,
  DataListItem,
  DataListMain,
  DataListValue,
} from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { can } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { priceAdjustments } from "@/lib/db/schema";
import { dateRangeLabel, weekdayMaskLabel } from "@/lib/format/dates";
import { currencySymbol, intlLocale } from "@/lib/format/money";
import { hotelAccess } from "@/lib/hotels/access";
import { deleteDatedRule } from "@/lib/inventory/actions";
import { adjustmentLabel, scopeLabel } from "@/lib/inventory/labels";
import { loadHotelBasics } from "@/lib/inventory/queries";
import { scopeValue } from "@/lib/inventory/schemas";
import { AvailabilityHeader } from "../availability-header";
import { byRelevance, loadInventoryNames } from "../list-data";
import { PriceAdjustmentDialog } from "../rule-forms";

export const metadata: Metadata = { title: "Price adjustments · Availability" };

export default async function AdjustmentsPage() {
  const access = await hotelAccess("inventory.view");
  if (access.status !== "ok") return <AccessState status={access.status} title="Availability" />;
  const { hotel } = access;
  const locale = intlLocale(hotel.locale, hotel.currency);
  const canManage = can(access.role, "inventory.manage");
  const hdb = db.forHotel(hotel.id);
  const { today } = await loadHotelBasics(hdb);
  const { names, scopes } = await loadInventoryNames(hdb);
  const rows = byRelevance(await hdb.select(priceAdjustments), today);
  const symbol = currencySymbol(hotel.currency, locale);

  return (
    <>
      <AvailabilityHeader
        actions={
          canManage ? (
            <PriceAdjustmentDialog scopes={scopes} currencySymbol={symbol} today={today} />
          ) : null
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No price adjustments"
          description="Every night sells at each rate plan's base price. Add an adjustment for a busy season, weekends or an event."
        />
      ) : (
        <DataList>
          {rows.map((row) => {
            const days = weekdayMaskLabel(row.weekdayMask);
            return (
              <DataListItem
                key={row.id}
                className={row.ended ? "text-muted-foreground" : undefined}
              >
                <DataListMain
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      {row.label}
                      {row.ended ? <Badge variant="neutral">Ended</Badge> : null}
                    </span>
                  }
                  detail={[
                    scopeLabel(row, names),
                    dateRangeLabel(row.dateFrom, row.dateTo, { locale }),
                    days || null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <DataListValue label="Repeats" className="sm:w-28">
                  {row.repeatsYearly ? (
                    "Every year"
                  ) : (
                    <span className="text-muted-foreground">Once</span>
                  )}
                </DataListValue>
                <DataListValue label="Change" className="font-semibold sm:w-44 sm:text-right">
                  {adjustmentLabel(row, hotel.currency, locale)}
                </DataListValue>
                {canManage ? (
                  <DataListActions>
                    <PriceAdjustmentDialog
                      adjustment={{
                        id: row.id,
                        label: row.label,
                        scope: scopeValue(row),
                        type: row.type,
                        value: row.value,
                        weekdayMask: row.weekdayMask,
                        dateFrom: row.dateFrom,
                        dateTo: row.dateTo,
                        repeatsYearly: row.repeatsYearly,
                      }}
                      scopes={scopes}
                      currencySymbol={symbol}
                      today={today}
                    />
                    <ConfirmDelete
                      action={deleteDatedRule}
                      id={row.id}
                      fields={{ kind: "price_adjustment" }}
                      label={`Delete ${row.label}`}
                      title={`Delete ${row.label}?`}
                      description="Nights it covered go back to their base price. Existing bookings keep the prices they were made at."
                    />
                  </DataListActions>
                ) : null}
              </DataListItem>
            );
          })}
        </DataList>
      )}
    </>
  );
}
