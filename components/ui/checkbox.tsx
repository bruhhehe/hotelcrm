import * as React from "react";
import { cn } from "@/lib/utils";

/** Native checkbox in the accent colour, with its label as a 44px touch target. */
export function Checkbox({
  className,
  label,
  description,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  label: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-3 py-2.5 text-[15px] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        className,
      )}
    >
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 cursor-[inherit]" {...props} />
      <span className="leading-snug">
        {label}
        {description ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
