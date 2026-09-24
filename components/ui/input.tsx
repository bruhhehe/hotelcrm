import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        // Border is the 3:1 `input` token; focus uses the global outline plus a border shift.
        "flex min-h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-base transition-colors placeholder:text-muted-foreground focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm pointer-coarse:min-h-11",
        className,
      )}
      {...props}
    />
  );
}
