import { ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A styled native `<select>`: the platform picker on phones, full keyboard support everywhere,
 * and it posts with the form like any input.
 */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex min-h-12 w-full min-w-0 appearance-none rounded-lg border border-input bg-background py-3 pr-11 pl-4 text-base transition-colors hover:border-foreground focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-4 size-[18px] -translate-y-1/2 text-foreground"
      />
    </div>
  );
}
