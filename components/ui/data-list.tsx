import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A list of records that reads as table rows on wide screens and stacked cards on phones,
 * without two markups: each row is a flex row that wraps into a column below `sm`.
 */
export function DataList({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("divide-y rounded-xl border bg-card", className)} {...props} />;
}

export function DataListItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn(
        "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

/** The row's main text: a title and optional secondary line. Takes the free space. */
export function DataListMain({
  title,
  detail,
  className,
}: {
  title: React.ReactNode;
  detail?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <div className="font-semibold">{title}</div>
      {detail ? <div className="mt-0.5 text-[15px] text-muted-foreground">{detail}</div> : null}
    </div>
  );
}

/** A labelled value. The label shows on phones only; wide rows rely on context. */
export function DataListValue({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 sm:block", className)}>
      <span className="text-sm text-muted-foreground sm:sr-only">{label}</span>
      <span className="text-[15px]">{children}</span>
    </div>
  );
}

export function DataListActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "-my-1 flex shrink-0 items-center gap-1 max-sm:-mr-2 max-sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
