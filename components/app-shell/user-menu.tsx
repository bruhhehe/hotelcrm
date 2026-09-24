import { CreditCard, Megaphone, Menu } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StaffUser } from "@/lib/auth/session";
import { initialsFor } from "@/lib/format/names";
import { cn } from "@/lib/utils";
import { SignOutItem } from "./sign-out-item";

export function UserAvatar({ user, className }: { user: StaffUser; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-[13px] font-semibold text-background",
        className,
      )}
    >
      {initialsFor(user.name, user.email)}
    </span>
  );
}

/** The hosting-app account pill: menu glyph plus avatar, lifting on hover. */
export function UserMenu({ user }: { user: StaffUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-11 shrink-0 items-center gap-2.5 rounded-full border bg-background pr-1 pl-3.5 transition-shadow hover:shadow-pill data-[state=open]:shadow-pill"
        aria-label="Account menu"
      >
        <Menu className="size-4" strokeWidth={2.25} aria-hidden />
        <UserAvatar user={user} className="size-8" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="truncate font-semibold">{user.name ?? "Your account"}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/whats-new">
            <Megaphone /> What&apos;s new
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/billing">
            <CreditCard /> Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
