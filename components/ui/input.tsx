import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        // Border is the 3:1 `input` token; focus thickens it to ink, plus the global outline.
        "flex min-h-12 w-full min-w-0 rounded-lg border border-input bg-background px-4 py-3 text-base transition-colors placeholder:text-muted-foreground hover:border-foreground focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
