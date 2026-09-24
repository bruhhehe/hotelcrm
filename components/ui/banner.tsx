import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const bannerVariants = cva("flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm", {
  variants: {
    variant: {
      warning: "border-warning-border bg-warning text-warning-foreground",
      info: "bg-card text-foreground",
      destructive: "border-destructive/20 bg-destructive-soft text-destructive",
      success: "border-primary/20 bg-primary-soft text-primary",
    },
  },
  defaultVariants: { variant: "info" },
});

/** Errors interrupt (`alert`); everything else is a polite `status`. Override with `role`. */
export function Banner({
  className,
  variant,
  role,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof bannerVariants>) {
  return (
    <div
      role={role ?? (variant === "destructive" ? "alert" : "status")}
      className={cn(bannerVariants({ variant }), className)}
      {...props}
    />
  );
}
