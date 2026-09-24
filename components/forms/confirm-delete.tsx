"use client";

import { Trash2 } from "lucide-react";
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
import type { FormAction } from "./form-dialog";

/**
 * A delete button that asks first. The action receives `id` (and any `fields`) and can refuse
 * with a message, e.g. when a room still has upcoming bookings.
 */
export function ConfirmDelete({
  action,
  id,
  fields,
  label,
  title,
  description,
}: {
  action: FormAction;
  id: string;
  fields?: Record<string, string>;
  /** Accessible name of the trigger, e.g. "Delete room 5". */
  label: string;
  title: string;
  description: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={label} title={label}>
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="pr-10">{title}</DialogTitle>
        <DialogDescription className="mt-1">{description}</DialogDescription>
        {open ? (
          <DeleteForm action={action} id={id} fields={fields} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DeleteForm({
  action,
  id,
  fields,
  onDone,
}: {
  action: FormAction;
  id: string;
  fields?: Record<string, string>;
  onDone: () => void;
}) {
  const [state, formAction, pending] = React.useActionState(action, null);
  const done = React.useRef(onDone);
  done.current = onDone;
  React.useEffect(() => {
    if (state?.ok) done.current();
  }, [state]);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      {Object.entries(fields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {state && !state.ok ? (
        <Banner variant="destructive">
          <p>{state.error}</p>
        </Banner>
      ) : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>
          Keep it
        </Button>
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </form>
  );
}
