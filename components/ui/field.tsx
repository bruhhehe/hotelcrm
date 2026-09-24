import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/**
 * Label, control, hint and error, wired for screen readers: pass the control's `id` as
 * `htmlFor`; give the control `aria-describedby={describedBy(id, …)}` and `aria-invalid`.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** `aria-describedby` for a control inside <Field>. */
export function describedBy(id: string, { hint, error }: { hint?: unknown; error?: unknown }) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

/** A titled group of fields inside a form. */
export function FieldGroup({
  legend,
  description,
  className,
  children,
}: {
  legend: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={cn("flex flex-col gap-4 pt-2", className)}>
      <legend className="mb-3 text-lg font-semibold">
        {legend}
        {description ? (
          <span className="mt-1 block text-sm font-normal text-muted-foreground">
            {description}
          </span>
        ) : null}
      </legend>
      {children}
    </fieldset>
  );
}
