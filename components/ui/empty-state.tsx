import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Nothing to show yet: plain words on the soft grey panel, the way a hosting app says
 * "You don't have any guests checking out today". `headingLevel="h1"` when it is the page.
 */
export function EmptyState({
  title,
  description,
  action,
  headingLevel: Heading = "h2",
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  headingLevel?: "h1" | "h2";
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl bg-muted px-6 py-8 sm:px-8 sm:py-10", className)}>
      <div className="max-w-xl">
        <Heading className="text-xl font-semibold sm:text-[22px]">{title}</Heading>
        {description ? (
          <div className="mt-2 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </div>
        ) : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </section>
  );
}
