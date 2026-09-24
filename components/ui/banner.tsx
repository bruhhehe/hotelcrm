import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const bannerVariants = cva("flex items-start gap-3 rounded-xl border px-4 py-3.5 text-[15px]", {
  variants: {
    variant: {
      warning: "border-warning-border bg-warning text-warning-foreground",
      info: "bg-background text-foreground",
      destructive: "border-destructive/25 bg-destructive-soft text-destructive",
      success: "border-primary/25 bg-primary-soft text-primary",
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
