import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A section with nothing to show yet. Left-aligned copy with the icon set inline at text size,
 * not a tile stacked above the heading. `headingLevel="h1"` when the empty state is the page.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  headingLevel: Heading = "h2",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  headingLevel?: "h1" | "h2";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-dashed border-input/60 px-6 py-10 sm:px-10 sm:py-14",
        className,
      )}
    >
      <div className="flex max-w-xl gap-4">
        <Icon className="mt-1 size-6 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
        <div>
          <Heading className="text-2xl font-semibold">{title}</Heading>
          {description ? <div className="mt-2 text-muted-foreground">{description}</div> : null}
          {action ? <div className="mt-6">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}
