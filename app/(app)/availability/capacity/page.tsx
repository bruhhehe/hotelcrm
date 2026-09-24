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
import { capacityOverrides } from "@/lib/db/schema";
import { dateRangeLabel } from "@/lib/format/dates";
import { intlLocale } from "@/lib/format/money";
import { hotelAccess } from "@/lib/hotels/access";
import { deleteDatedRule } from "@/lib/inventory/actions";
import { loadHotelBasics } from "@/lib/inventory/queries";
import { AvailabilityHeader } from "../availability-header";
import { byRelevance, loadInventoryNames } from "../list-data";
import { CapacityOverrideDialog } from "../rule-forms";

export const metadata: Metadata = { title: "Capacity · Availability" };

export default async function CapacityPage() {
  const access = await hotelAccess("inventory.view");
  if (access.status !== "ok") return <AccessState status={access.status} title="Availability" />;
  const { hotel } = access;
  const locale = intlLocale(hotel.locale, hotel.currency);
  const canManage = can(access.role, "inventory.manage");
  const hdb = db.forHotel(hotel.id);
  const { today } = await loadHotelBasics(hdb);
  const { types, names } = await loadInventoryNames(hdb);
  const rows = byRelevance(await hdb.select(capacityOverrides), today);

  const add =
    canManage && types.length > 0 ? (
      <CapacityOverrideDialog roomTypes={types} today={today} />
    ) : null;

  return (
    <>
      <AvailabilityHeader actions={add} />
      {rows.length === 0 ? (
        <EmptyState
          title="No capacity overrides"
          description="Every room of each type is for sale. Add an override to hold rooms back on some dates, for a renovation or a group you're keeping rooms for."
        />
      ) : (
        <DataList>
          {rows.map((row) => {
            const typeName = names.roomTypes.get(row.roomTypeId) ?? "A deleted room type";
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
                  detail={`${typeName} · ${dateRangeLabel(row.dateFrom, row.dateTo, { repeatsYearly: row.repeatsYearly, locale })}`}
                />
                <DataListValue label="Rooms to sell" className="sm:w-40 sm:text-right">
                  {row.roomsAvailable === 0
                    ? "None for sale"
                    : `${row.roomsAvailable} ${row.roomsAvailable === 1 ? "room" : "rooms"} for sale`}
                </DataListValue>
                {canManage ? (
                  <DataListActions>
                    <CapacityOverrideDialog
                      override={{
                        id: row.id,
                        roomTypeId: row.roomTypeId,
                        dateFrom: row.dateFrom,
                        dateTo: row.dateTo,
                        repeatsYearly: row.repeatsYearly,
                        roomsAvailable: row.roomsAvailable,
                        label: row.label,
                      }}
                      roomTypes={types}
                      today={today}
                    />
                    <ConfirmDelete
                      action={deleteDatedRule}
                      id={row.id}
                      fields={{ kind: "capacity_override" }}
                      label={`Delete ${row.label}`}
                      title={`Delete ${row.label}?`}
                      description={`All of ${typeName}'s rooms go back on sale for these dates.`}
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
