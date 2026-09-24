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
import { availabilityRules } from "@/lib/db/schema";
import { dateRangeLabel } from "@/lib/format/dates";
import { intlLocale } from "@/lib/format/money";
import { hotelAccess } from "@/lib/hotels/access";
import { deleteDatedRule } from "@/lib/inventory/actions";
import { ruleLabel, scopeLabel } from "@/lib/inventory/labels";
import { loadHotelBasics } from "@/lib/inventory/queries";
import { scopeValue } from "@/lib/inventory/schemas";
import { AvailabilityHeader } from "../availability-header";
import { byRelevance, loadInventoryNames } from "../list-data";
import { StayRuleDialog } from "../rule-forms";

export const metadata: Metadata = { title: "Stay rules · Availability" };

export default async function StayRulesPage() {
  const access = await hotelAccess("inventory.view");
  if (access.status !== "ok") return <AccessState status={access.status} title="Availability" />;
  const { hotel } = access;
  const locale = intlLocale(hotel.locale, hotel.currency);
  const canManage = can(access.role, "inventory.manage");
  const hdb = db.forHotel(hotel.id);
  const basics = await loadHotelBasics(hdb);
  const { names, scopes } = await loadInventoryNames(hdb);
  const rows = byRelevance(await hdb.select(availabilityRules), basics.today);
  const hotelMin = basics.settings.defaultMinNights;

  return (
    <>
      <AvailabilityHeader
        actions={canManage ? <StayRuleDialog scopes={scopes} today={basics.today} /> : null}
      />
      <p className="mb-6 text-[15px] text-muted-foreground">
        {hotelMin > 1
          ? `Every stay is at least ${hotelMin} nights (your hotel's minimum). Rules below add to it.`
          : "Stays of one night or more are allowed unless a rule below says otherwise."}{" "}
        Staff can still book through a rule on purpose; guests booking online can&apos;t.
      </p>
      {rows.length === 0 ? (
        <EmptyState
          title="No stay rules"
          description="Close dates, stop arrivals or departures on certain days, or set a minimum stay for busy periods."
        />
      ) : (
        <DataList>
          {rows.map((row) => (
            <DataListItem key={row.id} className={row.ended ? "text-muted-foreground" : undefined}>
              <DataListMain
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {ruleLabel(row)}
                    {row.ended ? <Badge variant="neutral">Ended</Badge> : null}
                  </span>
                }
                detail={[row.label, scopeLabel(row, names)].filter(Boolean).join(" · ")}
              />
              <DataListValue label="Dates" className="sm:w-72 sm:text-right">
                {dateRangeLabel(row.dateFrom, row.dateTo, {
                  repeatsYearly: row.repeatsYearly,
                  locale,
                })}
              </DataListValue>
              {canManage ? (
                <DataListActions>
                  <StayRuleDialog
                    rule={{
                      id: row.id,
                      kind: row.kind,
                      scope: scopeValue(row),
                      minNights: row.minNights,
                      label: row.label,
                      dateFrom: row.dateFrom,
                      dateTo: row.dateTo,
                      repeatsYearly: row.repeatsYearly,
                    }}
                    scopes={scopes}
                    today={basics.today}
                  />
                  <ConfirmDelete
                    action={deleteDatedRule}
                    id={row.id}
                    fields={{ kind: "availability_rule" }}
                    label={`Delete ${ruleLabel(row)}${row.label ? ` (${row.label})` : ""}`}
                    title="Delete this rule?"
                    description="Those dates can be booked without it straight away."
                  />
                </DataListActions>
              ) : null}
            </DataListItem>
          ))}
        </DataList>
      )}
    </>
  );
}
