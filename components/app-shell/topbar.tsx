import { Bell, CalendarPlus, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StaffUser } from "@/lib/auth/session";
import { CommandPalette } from "./command-palette";
import { MobileNav } from "./mobile-nav";
import { TrialPill } from "./trial-pill";
import { UserMenu } from "./user-menu";

export function Topbar({ user, trialEndsAt }: { user: StaffUser; trialEndsAt: Date | null }) {
  return (
    <header className="sticky top-0 z-20 flex h-topbar items-center gap-2 border-b bg-background/85 px-4 backdrop-blur sm:gap-3 sm:px-6">
      <MobileNav />
      <div className="min-w-0 flex-1">
        <CommandPalette />
      </div>
      {trialEndsAt ? <TrialPill trialEndsAt={trialEndsAt} /> : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" aria-label="Create new">
            <Plus className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-semibold">Create</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <CalendarPlus /> Reservation
            <span className="ml-auto text-xs text-muted-foreground">Soon</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <UserPlus /> Guest
            <span className="ml-auto text-xs text-muted-foreground">Soon</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserMenu user={user} />
    </header>
  );
}
