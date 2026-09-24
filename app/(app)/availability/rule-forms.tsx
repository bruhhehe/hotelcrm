"use client";

import { Pencil, Plus } from "lucide-react";
import * as React from "react";
import { FormDialog } from "@/components/forms/form-dialog";
import { WeekdayPicker } from "@/components/forms/weekday-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { saveCapacityOverride, savePriceAdjustment, saveStayRule } from "@/lib/inventory/actions";
import { RULE_KIND_LABEL } from "@/lib/inventory/labels";
import { moneyInputValue, percentInputValue } from "@/lib/money/parse";

export type ScopeOptions = {
  roomTypes: { value: string; label: string }[];
  ratePlans: { value: string; label: string }[];
};

type Range = { dateFrom: string; dateTo: string; repeatsYearly: boolean };

/** The dialog trigger: an edit icon on a row, or the tab's add button. A plain element, since
 * `DialogTrigger asChild` passes its handlers to its direct child. */
function trigger(editing: boolean, name: string | undefined, addLabel: string) {
  return editing ? (
    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${name}`} title="Edit">
      <Pencil />
    </Button>
  ) : (
    <Button>
      <Plus />
      {addLabel}
    </Button>
  );
}

function DateRangeFields({
  errors,
  value,
  lastLabel = "To",
}: {
  errors: Record<string, string>;
  value: Range;
  lastLabel?: string;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="From" htmlFor="range-from" error={errors.dateFrom}>
          <Input
            id="range-from"
            name="dateFrom"
            type="date"
            defaultValue={value.dateFrom}
            required
            aria-invalid={Boolean(errors.dateFrom)}
          />
        </Field>
        <Field label={lastLabel} htmlFor="range-to" error={errors.dateTo}>
          <Input
            id="range-to"
            name="dateTo"
            type="date"
            defaultValue={value.dateTo}
            required
            aria-invalid={Boolean(errors.dateTo)}
          />
        </Field>
      </div>
      <Checkbox
        name="repeatsYearly"
        defaultChecked={value.repeatsYearly}
        label="Repeat every year"
        description="The same dates every year from the first one on."
      />
    </>
  );
}

function ScopeSelect({
  id,
  options,
  defaultValue,
  error,
  hint,
}: {
  id: string;
  options: ScopeOptions;
  defaultValue: string;
  error?: string;
  hint?: string;
}) {
  return (
    <Field label="Applies to" htmlFor={id} error={error} hint={hint}>
      <NativeSelect
        id={id}
        name="scope"
        defaultValue={defaultValue}
        aria-describedby={describedBy(id, { hint, error })}
      >
        <option value="all">All rooms</option>
        <optgroup label="Room types">
          {options.roomTypes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </optgroup>
        {options.ratePlans.length > 0 ? (
          <optgroup label="Rate plans">
            {options.ratePlans.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ) : null}
      </NativeSelect>
    </Field>
  );
}

// ── Capacity overrides ───────────────────────────────────────────────────────

export type CapacityOverrideValues = Range & {
  id: string;
  roomTypeId: string;
  roomsAvailable: number;
  label: string;
};

export function CapacityOverrideDialog({
  override,
  roomTypes,
  today,
}: {
  override?: CapacityOverrideValues;
  roomTypes: { id: string; name: string; rooms: number }[];
  today: string;
}) {
  const editing = override !== undefined;
  const value = override ?? {
    dateFrom: today,
    dateTo: today,
    repeatsYearly: false,
    roomTypeId: roomTypes[0]?.id ?? "",
    roomsAvailable: 0,
    label: "",
  };
  return (
    <FormDialog
      title={editing ? `Edit ${override.label}` : "Add a capacity override"}
      description="Limit how many rooms of a type can be sold, for a renovation or a group block."
      action={saveCapacityOverride}
      submitLabel={editing ? "Save" : "Add override"}
      trigger={trigger(editing, override?.label, "Add override")}
    >
      {(errors) => (
        <>
          {editing ? <input type="hidden" name="id" value={override.id} /> : null}
          <Field label="Name" htmlFor="co-label" error={errors.label}>
            <Input
              id="co-label"
              name="label"
              defaultValue={value.label}
              placeholder="January refurbishment"
              autoComplete="off"
              required
              aria-invalid={Boolean(errors.label)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <Field label="Room type" htmlFor="co-type" error={errors.roomTypeId}>
              <NativeSelect id="co-type" name="roomTypeId" defaultValue={value.roomTypeId}>
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.rooms} {t.rooms === 1 ? "room" : "rooms"})
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Rooms to sell" htmlFor="co-rooms" error={errors.roomsAvailable}>
              <Input
                id="co-rooms"
                name="roomsAvailable"
                type="number"
                inputMode="numeric"
                min={0}
                max={500}
                defaultValue={value.roomsAvailable}
                aria-invalid={Boolean(errors.roomsAvailable)}
              />
            </Field>
          </div>
          <DateRangeFields errors={errors} value={value} lastLabel="To (last night)" />
        </>
      )}
    </FormDialog>
  );
}

// ── Price adjustments ────────────────────────────────────────────────────────

export type PriceAdjustmentValues = Range & {
  id: string;
  label: string;
  scope: string;
  type: "percentage" | "fixed" | "override";
  value: number;
  weekdayMask: number;
};

export function PriceAdjustmentDialog({
  adjustment,
  scopes,
  currencySymbol,
  today,
}: {
  adjustment?: PriceAdjustmentValues;
  scopes: ScopeOptions;
  currencySymbol: string;
  today: string;
}) {
  const editing = adjustment !== undefined;
  return (
    <FormDialog
      title={editing ? `Edit ${adjustment.label}` : "Add a price adjustment"}
      description="Raise or lower prices for a season, a weekend or an event. One adjustment prices each night: a set price beats an amount, which beats a percentage, and the newest wins a tie."
      action={savePriceAdjustment}
      submitLabel={editing ? "Save" : "Add adjustment"}
      trigger={trigger(editing, adjustment?.label, "Add adjustment")}
      wide
    >
      {(errors) => (
        <AdjustmentFields
          errors={errors}
          adjustment={adjustment}
          scopes={scopes}
          currencySymbol={currencySymbol}
          today={today}
        />
      )}
    </FormDialog>
  );
}

function AdjustmentFields({
  errors,
  adjustment,
  scopes,
  currencySymbol,
  today,
}: {
  errors: Record<string, string>;
  adjustment?: PriceAdjustmentValues;
  scopes: ScopeOptions;
  currencySymbol: string;
  today: string;
}) {
  const [type, setType] = React.useState(adjustment?.type ?? "percentage");
  const amount = adjustment
    ? adjustment.type === "percentage"
      ? percentInputValue(Math.abs(adjustment.value))
      : moneyInputValue(Math.abs(adjustment.value))
    : "";
  const range = adjustment ?? { dateFrom: today, dateTo: today, repeatsYearly: false };
  return (
    <>
      {adjustment ? <input type="hidden" name="id" value={adjustment.id} /> : null}
      <Field label="Name" htmlFor="pa-label" error={errors.label}>
        <Input
          id="pa-label"
          name="label"
          defaultValue={adjustment?.label}
          placeholder="Summer season"
          autoComplete="off"
          required
          aria-invalid={Boolean(errors.label)}
        />
      </Field>
      <ScopeSelect
        id="pa-scope"
        options={scopes}
        defaultValue={adjustment?.scope ?? "all"}
        error={errors.scope}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Change" htmlFor="pa-type" className="sm:col-span-2">
          <NativeSelect
            id="pa-type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as PriceAdjustmentValues["type"])}
          >
            <option value="percentage">By a percentage</option>
            <option value="fixed">By an amount a night</option>
            <option value="override">Set the price a night</option>
          </NativeSelect>
        </Field>
        {type !== "override" ? (
          <Field label="Direction" htmlFor="pa-direction">
            <NativeSelect
              id="pa-direction"
              name="direction"
              defaultValue={adjustment && adjustment.value < 0 ? "down" : "up"}
            >
              <option value="up">Increase</option>
              <option value="down">Decrease</option>
            </NativeSelect>
          </Field>
        ) : null}
      </div>
      <Field
        label={
          type === "percentage"
            ? "Percentage"
            : type === "fixed"
              ? "Amount a night"
              : "Price a night"
        }
        htmlFor="pa-amount"
        error={errors.amount}
      >
        <div className="relative max-w-56">
          <span
            aria-hidden
            className={
              type === "percentage"
                ? "pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground"
                : "pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
            }
          >
            {type === "percentage" ? "%" : currencySymbol}
          </span>
          <Input
            id="pa-amount"
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={amount}
            className={type === "percentage" ? "pr-10" : "pl-9"}
            placeholder={type === "percentage" ? "20" : "25.00"}
            required
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy("pa-amount", { error: errors.amount })}
          />
        </div>
      </Field>
      <WeekdayPicker legend="On these nights" defaultMask={adjustment?.weekdayMask ?? 127} />
      <DateRangeFields errors={errors} value={range} lastLabel="To (last night)" />
    </>
  );
}

// ── Stay rules ───────────────────────────────────────────────────────────────

export type StayRuleValues = Range & {
  id: string;
  kind: keyof typeof RULE_KIND_LABEL;
  scope: string;
  minNights: number | null;
  label: string | null;
};

const KIND_HELP: Record<keyof typeof RULE_KIND_LABEL, string> = {
  closed: "Nothing can be booked on these nights.",
  closed_to_arrival: "Guests can't check in on these days.",
  closed_to_departure: "Guests can't check out on these days.",
  min_stay: "Guests arriving on these days must stay at least this long.",
};

export function StayRuleDialog({
  rule,
  scopes,
  today,
}: {
  rule?: StayRuleValues;
  scopes: ScopeOptions;
  today: string;
}) {
  const editing = rule !== undefined;
  return (
    <FormDialog
      title={editing ? "Edit stay rule" : "Add a stay rule"}
      action={saveStayRule}
      submitLabel={editing ? "Save" : "Add rule"}
      trigger={trigger(
        editing,
        rule ? (rule.label ?? RULE_KIND_LABEL[rule.kind]) : undefined,
        "Add rule",
      )}
    >
      {(errors) => <RuleFields errors={errors} rule={rule} scopes={scopes} today={today} />}
    </FormDialog>
  );
}

function RuleFields({
  errors,
  rule,
  scopes,
  today,
}: {
  errors: Record<string, string>;
  rule?: StayRuleValues;
  scopes: ScopeOptions;
  today: string;
}) {
  const [kind, setKind] = React.useState<StayRuleValues["kind"]>(rule?.kind ?? "min_stay");
  const range = rule ?? { dateFrom: today, dateTo: today, repeatsYearly: false };
  return (
    <>
      {rule ? <input type="hidden" name="id" value={rule.id} /> : null}
      <Field label="Rule" htmlFor="sr-kind" hint={KIND_HELP[kind]}>
        <NativeSelect
          id="sr-kind"
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as StayRuleValues["kind"])}
          aria-describedby="sr-kind-hint"
        >
          {Object.entries(RULE_KIND_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {kind === "min_stay" ? (
        <Field label="Minimum nights" htmlFor="sr-min" error={errors.minNights}>
          <Input
            id="sr-min"
            name="minNights"
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            defaultValue={rule?.minNights ?? 2}
            className="max-w-40"
            aria-invalid={Boolean(errors.minNights)}
          />
        </Field>
      ) : null}
      <ScopeSelect
        id="sr-scope"
        options={scopes}
        defaultValue={rule?.scope ?? "all"}
        error={errors.scope}
        hint="A rule on one rate plan only applies when that plan is booked."
      />
      <DateRangeFields errors={errors} value={range} />
      <Field label="Name (optional)" htmlFor="sr-label" error={errors.label}>
        <Input
          id="sr-label"
          name="label"
          defaultValue={rule?.label ?? ""}
          placeholder="Bank holiday weekend"
          autoComplete="off"
        />
      </Field>
    </>
  );
}
