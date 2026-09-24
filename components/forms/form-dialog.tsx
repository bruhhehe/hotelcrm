"use client";

import * as React from "react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/actions/result";
import { cn } from "@/lib/utils";

export type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

export type FieldErrors = Record<string, string>;

/**
 * A dialog holding one server-action form. It closes when the action succeeds (the page's data
 * refreshes through revalidation) and shows the action's errors when it doesn't. The form is
 * remounted each time the dialog opens, so it always starts from `children`'s defaults.
 */
export function FormDialog({
  trigger,
  title,
  description,
  action,
  submitLabel,
  children,
  wide = false,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action: FormAction;
  submitLabel: string;
  children: (errors: FieldErrors) => React.ReactNode;
  wide?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [announcement, setAnnouncement] = React.useState("");

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent className={cn(wide && "sm:max-w-2xl")}>
          <DialogTitle className="pr-10">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="mt-1">{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
          {open ? (
            <DialogForm
              action={action}
              submitLabel={submitLabel}
              onDone={(message) => {
                setAnnouncement(message ?? "Saved.");
                setOpen(false);
              }}
              onCancel={() => setOpen(false)}
            >
              {children}
            </DialogForm>
          ) : null}
        </DialogContent>
      </Dialog>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}

function DialogForm({
  action,
  submitLabel,
  onDone,
  onCancel,
  children,
}: {
  action: FormAction;
  submitLabel: string;
  onDone: (message?: string) => void;
  onCancel: () => void;
  children: (errors: FieldErrors) => React.ReactNode;
}) {
  const [state, formAction, pending] = React.useActionState(action, null);
  const done = React.useRef(onDone);
  done.current = onDone;

  React.useEffect(() => {
    if (state?.ok) done.current(state.message);
  }, [state]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok ? state.error : undefined;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-5" noValidate>
      {formError ? (
        <Banner variant="destructive">
          <p>{formError}</p>
        </Banner>
      ) : null}
      {children(errors)}
      {/* Sticky insets stop at the dialog's padding, so -bottom-6 reaches its real edge. */}
      <div className="sticky -bottom-6 z-10 -mx-6 -mb-6 flex justify-end gap-2 border-t bg-card px-6 py-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
