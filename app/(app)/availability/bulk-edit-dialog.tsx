"use client";

import * as React from "react";
import { FormDialog } from "@/components/forms/form-dialog";
import { WeekdayPicker } from "@/components/forms/weekday-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { describedBy, Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { applyBulkEdit } from "@/lib/inventory/actions";

export type BulkEditTarget = {
  dateFrom: string;
  dateTo: string;
  roomTypeIds: string[];
  ratePlanId?: string | null;
  /** The night's current price, when opened from a price cell. */
  priceAmount?: string;
};

export type BulkEditRoomType = {
  id: string;
  name: string;
  plans: { id: string; name: string }[];
};

const PRICE_MODES = [
  { value: "none", label: "Keep prices as they are" },
  { value: "set", label: "Set the price a night to" },
  { value: "up_percent", label: "Increase by a percentage" },
  { value: "down_percent", label: "Decrease by a percentage" },
  { value: "up_amount", label: "Increase by an amount a night" },
  { value: "down_amount", label: "Decrease by an amount a night" },
] as const;

type PriceMode = (typeof PRICE_MODES)[number]["value"];

/**
 * "Edit dates": change rooms to sell, prices and stay rules over a date range for one or more
 * room types in one go. Each change is saved as an ordinary override, adjustment or rule, so it
 * shows (and can be removed) in its own tab.
 */
export function BulkEditDialog({
  open,
  onOpenChange,
  target,
  roomTypes,
  currencySymbol,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: BulkEditTarget;
  roomTypes: BulkEditRoomType[];
  currencySymbol: string;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit dates"
      description="Changes apply to every night in the range. Each one is listed in its own tab, where you can change or remove it later."
      action={applyBulkEdit}
      submitLabel="Save changes"
      wide
    >
      {(errors) => (
        <BulkEditFields
          errors={errors}
          target={target}
          roomTypes={roomTypes}
          currencySymbol={currencySymbol}
        />
      )}
    </FormDialog>
  );
}

function BulkEditFields({
  errors,
  target,
  roomTypes,
  currencySymbol,
}: {
  errors: Record<string, string>;
  target: BulkEditTarget;
  roomTypes: BulkEditRoomType[];
  currencySymbol: string;
}) {
  const [selected, setSelected] = React.useState<string[]>(target.roomTypeIds);
  const [priceMode, setPriceMode] = React.useState<PriceMode>(target.ratePlanId ? "set" : "none");
  const single = selected.length === 1 ? roomTypes.find((t) => t.id === selected[0]) : undefined;
  const percent = priceMode.endsWith("percent");

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="From" htmlFor="bulk-from" error={errors.dateFrom}>
          <Input
            id="bulk-from"
            name="dateFrom"
            type="date"
            defaultValue={target.dateFrom}
            required
            aria-invalid={Boolean(errors.dateFrom)}
          />
        </Field>
        <Field label="To (last night)" htmlFor="bulk-to" error={errors.dateTo}>
          <Input
            id="bulk-to"
            name="dateTo"
            type="date"
            defaultValue={target.dateTo}
            required
            aria-invalid={Boolean(errors.dateTo)}
          />
        </Field>
      </div>

      <FieldGroup legend="Room types">
        <div className="-mt-2 grid gap-x-6 sm:grid-cols-2">
          {roomTypes.map((type) => (
            <Checkbox
              key={type.id}
              name="roomTypeIds"
              value={type.id}
              label={type.name}
              checked={selected.includes(type.id)}
              onChange={(e) =>
                setSelected((ids) =>
                  e.target.checked ? [...ids, type.id] : ids.filter((id) => id !== type.id),
                )
              }
            />
          ))}
        </div>
        {errors.roomTypeIds ? (
          <p className="text-sm font-medium text-destructive">{errors.roomTypeIds}</p>
        ) : null}
      </FieldGroup>

      <Field
        label="Rooms to sell a night"
        htmlFor="bulk-rooms"
        hint="Leave empty to keep the usual number. 0 stops sales without closing."
        error={errors.rooms}
      >
        <Input
          id="bulk-rooms"
          name="rooms"
          type="number"
          inputMode="numeric"
          min={0}
          max={500}
          className="max-w-40"
          aria-invalid={Boolean(errors.rooms)}
          aria-describedby={describedBy("bulk-rooms", { hint: true, error: errors.rooms })}
        />
      </Field>

      <FieldGroup legend="Price">
        <Field label="Change" htmlFor="bulk-price-mode">
          <NativeSelect
            id="bulk-price-mode"
            name="priceMode"
            value={priceMode}
            onChange={(e) => setPriceMode(e.target.value as PriceMode)}
          >
            {PRICE_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {priceMode !== "none" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={percent ? "Percentage" : "Amount"}
                htmlFor="bulk-price-amount"
                error={errors.priceAmount}
              >
                <div className="relative">
                  <span
                    aria-hidden
                    className={
                      percent
                        ? "pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground"
                        : "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
                    }
                  >
                    {percent ? "%" : currencySymbol}
                  </span>
                  <Input
                    id="bulk-price-amount"
                    name="priceAmount"
                    inputMode="decimal"
                    autoComplete="off"
                    className={percent ? "pr-10" : "pl-9"}
                    placeholder={percent ? "15" : "125.00"}
                    defaultValue={priceMode === "set" ? target.priceAmount : undefined}
                    required
                    aria-invalid={Boolean(errors.priceAmount)}
                    aria-describedby={describedBy("bulk-price-amount", {
                      error: errors.priceAmount,
                    })}
                  />
                </div>
              </Field>
              <Field
                label="Rate plans"
                htmlFor="bulk-plan"
                hint={single ? undefined : "Pick one room type to change a single plan."}
                error={errors.ratePlanId}
              >
                <NativeSelect
                  id="bulk-plan"
                  name="ratePlanId"
                  defaultValue={target.ratePlanId ?? ""}
                  disabled={!single}
                  aria-describedby={describedBy("bulk-plan", {
                    hint: !single,
                    error: errors.ratePlanId,
                  })}
                >
                  <option value="">All rate plans</option>
                  {single?.plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <WeekdayPicker legend="On these nights" />
          </>
        ) : null}
      </FieldGroup>

      <FieldGroup legend="Stay rules">
        <div className="-mt-2">
          <Checkbox
            name="close"
            label="Close"
            description="Nothing can be booked on these nights."
          />
          <Checkbox
            name="closedToArrival"
            label="No arrivals"
            description="Guests can't check in on these days."
          />
          <Checkbox
            name="closedToDeparture"
            label="No departures"
            description="Guests can't check out on these days."
          />
        </div>
        <Field
          label="Minimum stay"
          htmlFor="bulk-min"
          hint="Nights, for guests arriving on these days. Leave empty to keep."
          error={errors.minNights}
        >
          <Input
            id="bulk-min"
            name="minNights"
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            className="max-w-40"
            aria-invalid={Boolean(errors.minNights)}
            aria-describedby={describedBy("bulk-min", { hint: true, error: errors.minNights })}
          />
        </Field>
      </FieldGroup>

      <Field
        label="Name"
        htmlFor="bulk-label"
        hint="Shown in the lists, like “Christmas” or “Kitchen refit”."
        error={errors.label}
      >
        <Input
          id="bulk-label"
          name="label"
          autoComplete="off"
          required
          aria-invalid={Boolean(errors.label)}
          aria-describedby={describedBy("bulk-label", { hint: true, error: errors.label })}
        />
      </Field>
      <Checkbox
        name="repeatsYearly"
        label="Repeat every year"
        description="The same dates every year from now on."
      />
    </>
  );
}
