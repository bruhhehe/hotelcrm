"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { closeButtonClass, DialogOverlay } from "./dialog";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;

const sideClass = {
  left: "inset-y-0 left-0 w-[min(var(--sidebar-width),85vw)]",
  right: "inset-y-0 right-0 w-[min(var(--sidebar-width),85vw)]",
  /** Phone menus: a sheet that rises from the tab bar, clear of the home indicator. */
  bottom:
    "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)] overflow-y-auto",
} as const;

export function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: keyof typeof sideClass }) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col bg-background shadow-float outline-none",
          sideClass[side],
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className={closeButtonClass}>
          <XIcon className="size-[18px]" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
