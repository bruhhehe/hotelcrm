"use client";

import { Pencil, Plus } from "lucide-react";
import { FormDialog } from "@/components/forms/form-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { describedBy, Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { saveRatePlan } from "@/lib/inventory/actions";
import { moneyInputValue } from "@/lib/money/parse";

export type RatePlanFormValues = {
  id: string;
  name: string;
  baseNightlyPrice: number;
  includesBreakfast: boolean;
  cancellationPolicyId: string | null;
  minNights: number;
  isDefault: boolean;
};

export function RatePlanDialog({
  plan,
  roomType,
  policies,
  currencySymbol,
  isFirst = false,
}: {
  plan?: RatePlanFormValues;
  roomType: { id: string; name: string };
  policies: { id: string; name: string }[];
  currencySymbol: string;
  isFirst?: boolean;
}) {
  const editing = plan !== undefined;
  return (
    <FormDialog
      title={editing ? `Edit ${plan.name}` : `Add a rate plan to ${roomType.name}`}
      description="The nightly price before seasonal adjustments."
      action={saveRatePlan}
      submitLabel={editing ? "Save" : "Add rate plan"}
      trigger={
        editing ? (
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${plan.name}`} title="Edit">
            <Pencil />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus />
            Add rate plan
          </Button>
        )
      }
    >
      {(errors) => (
        <>
          {editing ? <input type="hidden" name="id" value={plan.id} /> : null}
          <input type="hidden" name="roomTypeId" value={roomType.id} />
          <Field label="Name" htmlFor="rp-name" error={errors.name}>
            <Input
              id="rp-name"
              name="name"
              defaultValue={plan?.name}
              placeholder="Bed & breakfast"
              autoComplete="off"
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy("rp-name", { error: errors.name })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price a night" htmlFor="rp-price" error={errors.baseNightlyPrice}>
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
                >
                  {currencySymbol}
                </span>
                <Input
                  id="rp-price"
                  name="baseNightlyPrice"
                  inputMode="decimal"
                  className="pl-9"
                  defaultValue={plan ? moneyInputValue(plan.baseNightlyPrice) : ""}
                  placeholder="125.00"
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(errors.baseNightlyPrice)}
                  aria-describedby={describedBy("rp-price", { error: errors.baseNightlyPrice })}
                />
              </div>
            </Field>
            <Field label="Minimum stay" htmlFor="rp-min" error={errors.minNights} hint="Nights">
              <Input
                id="rp-min"
                name="minNights"
                type="number"
                inputMode="numeric"
                min={1}
                max={60}
                defaultValue={plan?.minNights ?? 1}
                aria-invalid={Boolean(errors.minNights)}
                aria-describedby={describedBy("rp-min", { hint: true, error: errors.minNights })}
              />
            </Field>
          </div>
          <Field
            label="Cancellation policy"
            htmlFor="rp-policy"
            error={errors.cancellationPolicyId}
          >
            <NativeSelect
              id="rp-policy"
              name="cancellationPolicyId"
              defaultValue={plan?.cancellationPolicyId ?? policies[0]?.id ?? ""}
            >
              <option value="">No cancellation policy</option>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <div>
            <Checkbox
              name="includesBreakfast"
              defaultChecked={plan?.includesBreakfast ?? false}
              label="Breakfast included"
            />
            <Checkbox
              name="isDefault"
              defaultChecked={plan?.isDefault ?? isFirst}
              label="Default plan for this room type"
              description="Shown first when booking, and in the availability grid."
            />
          </div>
        </>
      )}
    </FormDialog>
  );
}
