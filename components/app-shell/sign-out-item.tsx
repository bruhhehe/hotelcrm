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
