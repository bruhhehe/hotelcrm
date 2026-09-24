"use client";

import * as React from "react";
import { WEEKDAY_NAMES } from "@/lib/format/dates";
import { cn } from "@/lib/utils";

/**
 * Seven day toggles posting `weekdays[]` (0 = Monday … 6 = Sunday). The last day left on
 * can't be switched off, so the form always sends at least one.
 */
export function WeekdayPicker({
  defaultMask = 127,
  legend = "Days of the week",
  describedBy,
}: {
  defaultMask?: number;
  legend?: string;
  describedBy?: string;
}) {
  const [mask, setMask] = React.useState(defaultMask & 127);
  const count = WEEKDAY_NAMES.filter((_, i) => mask & (1 << i)).length;
  return (
    <fieldset aria-describedby={describedBy}>
      <legend className="mb-2 text-[15px] font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {WEEKDAY_NAMES.map((day, i) => {
          const on = (mask & (1 << i)) !== 0;
          return (
            <label
              key={day}
              className={cn(
                "flex min-h-11 min-w-12 cursor-pointer items-center justify-center rounded-full border px-3 text-[15px] font-semibold transition-colors select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring sm:min-h-10",
                on
                  ? "border-foreground bg-foreground text-background"
                  : "border-input bg-background hover:border-foreground",
                on && count === 1 && "cursor-not-allowed",
              )}
            >
              <input
                type="checkbox"
                name="weekdays[]"
                value={i}
                checked={on}
                disabled={on && count === 1}
                onChange={() => setMask((m) => m ^ (1 << i))}
                className="sr-only"
              />
              {day}
            </label>
          );
        })}
      </div>
      {/* A disabled checkbox doesn't post; keep the last day in the submission. */}
      {count === 1 ? (
        <input
          type="hidden"
          name="weekdays[]"
          value={WEEKDAY_NAMES.findIndex((_, i) => mask & (1 << i))}
        />
      ) : null}
    </fieldset>
  );
}
