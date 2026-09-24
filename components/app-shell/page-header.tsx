import * as React from "react";

export function PageHeader({
  title,
  description,
  actions,
  size = "default",
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** "hero" is reserved for the dashboard greeting, the app's opening moment. */
  size?: "default" | "hero";
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1
          className={
            size === "hero"
              ? "text-[34px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-[44px]"
              : "text-[28px] leading-tight font-bold sm:text-[32px]"
          }
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-base text-muted-foreground sm:text-lg">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
