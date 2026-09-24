import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AccessState } from "@/components/app-shell/access-state";
import { BackLink } from "@/components/app-shell/back-link";
import { PageHeader } from "@/components/app-shell/page-header";
import { ConfirmDelete } from "@/components/forms/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataList,
  DataListActions,
  DataListItem,
  DataListMain,
  DataListValue,
} from "@/components/ui/data-list";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { cancellationPolicies, ratePlans, roomTypes } from "@/lib/db/schema";
import { currencySymbol, formatPrice, intlLocale } from "@/lib/format/money";
import { hotelAccess } from "@/lib/hotels/access";
import { deleteRatePlan } from "@/lib/inventory/actions";
import { RatePlanDialog } from "./rate-plan-dialog";

export const metadata: Metadata = { title: "Rates" };

export default async function RatesSettingsPage() {
  const access = await hotelAccess("settings.view");
  if (access.status !== "ok") return <AccessState status={access.status} title="Rates" />;
  const { hotel } = access;
  const locale = intlLocale(hotel.locale, hotel.currency);

  const hdb = db.forHotel(hotel.id);
  const types = await hdb.select(roomTypes, undefined, {
    orderBy: [asc(roomTypes.sortOrder), asc(roomTypes.name)],
  });
  const plans = await hdb.select(ratePlans, undefined, {
    orderBy: [asc(ratePlans.createdAt)],
  });
  const policies = await hdb.select(cancellationPolicies, undefined, {
    orderBy: [asc(cancellationPolicies.name)],
  });
  const policyOptions = policies.map((p) => ({ id: p.id, name: p.name }));
  const policyName = new Map(policies.map((p) => [p.id, p.name]));
  const symbol = currencySymbol(hotel.currency, locale);

  return (
    <>
      <BackLink href="/settings" label="Settings" />
      <PageHeader
        title="Rates"
        description="Each room type's rate plans and their prices a night, before seasonal adjustments."
      />

      {types.length === 0 ? (
        <EmptyState
          title="Add rooms first"
          description="Rate plans belong to a room type. Add your room types, then set their prices here."
          action={
            <Button asChild>
              <Link href="/settings/rooms">Go to rooms</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-10">
          {types.map((type) => {
            const typePlans = plans
              .filter((p) => p.roomTypeId === type.id)
              .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
            return (
              <section key={type.id} aria-labelledby={`rates-${type.id}`}>
                <h2 id={`rates-${type.id}`} className="mb-3 text-xl font-semibold sm:text-[22px]">
                  {type.name}
                </h2>
                {typePlans.length > 0 ? (
                  <DataList>
                    {typePlans.map((plan) => (
                      <DataListItem key={plan.id}>
                        <DataListMain
                          title={
                            <span className="flex flex-wrap items-center gap-2">
                              {plan.name}
                              {plan.isDefault ? <Badge variant="neutral">Default</Badge> : null}
                            </span>
                          }
                          detail={
                            [
                              plan.includesBreakfast ? "Breakfast included" : null,
                              plan.minNights > 1 ? `Minimum ${plan.minNights} nights` : null,
                              plan.cancellationPolicyId
                                ? policyName.get(plan.cancellationPolicyId)
                                : "No cancellation policy",
                            ]
                              .filter(Boolean)
                              .join(" · ") || undefined
                          }
                        />
                        <DataListValue label="Price a night" className="sm:text-right">
                          <span className="font-semibold">
                            {formatPrice(plan.baseNightlyPrice, hotel.currency, locale)}
                          </span>
                          <span className="text-muted-foreground"> a night</span>
                        </DataListValue>
                        <DataListActions>
                          <RatePlanDialog
                            plan={{
                              id: plan.id,
                              name: plan.name,
                              baseNightlyPrice: plan.baseNightlyPrice,
                              includesBreakfast: plan.includesBreakfast,
                              cancellationPolicyId: plan.cancellationPolicyId,
                              minNights: plan.minNights,
                              isDefault: plan.isDefault,
                            }}
                            roomType={{ id: type.id, name: type.name }}
                            policies={policyOptions}
                            currencySymbol={symbol}
                          />
                          <ConfirmDelete
                            action={deleteRatePlan}
                            id={plan.id}
                            label={`Delete ${plan.name} for ${type.name}`}
                            title={`Delete ${plan.name}?`}
                            description="It stops being bookable. Existing bookings keep the prices they were made at, and its seasonal rules are removed."
                          />
                        </DataListActions>
                      </DataListItem>
                    ))}
                  </DataList>
                ) : (
                  <p className="rounded-xl bg-muted px-5 py-4 text-[15px] text-muted-foreground">
                    No rate plans yet, so {type.name} can&apos;t be priced or booked.
                  </p>
                )}
                <div className="mt-3">
                  <RatePlanDialog
                    roomType={{ id: type.id, name: type.name }}
                    policies={policyOptions}
                    currencySymbol={symbol}
                    isFirst={typePlans.length === 0}
                  />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
