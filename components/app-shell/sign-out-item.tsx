"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth/actions";

/**
 * Calls the action from onSelect: a <form> inside the menu would be unmounted by the
 * menu closing before its submit fires.
 */
export function SignOutItem() {
  const [pending, startTransition] = useTransition();
  return (
    <DropdownMenuItem
      disabled={pending}
      onSelect={(e) => {
        e.preventDefault();
        startTransition(() => signOutAction());
      }}
    >
      <LogOut /> {pending ? "Signing out…" : "Sign out"}
    </DropdownMenuItem>
  );
}

/** Same action as a plain button, for the phone menu sheet. */
export function SignOutButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
      className={className}
    >
      <LogOut className="size-[22px]" strokeWidth={1.75} aria-hidden />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
