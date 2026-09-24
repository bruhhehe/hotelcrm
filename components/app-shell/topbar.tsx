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
import { Logo } from "./logo";
import { TrialPill } from "./trial-pill";
import { UserMenu } from "./user-menu";

export function Topbar({ user, trialEndsAt }: { user: StaffUser; trialEndsAt: Date | null }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-background px-4 sm:gap-3 sm:px-6 lg:h-topbar lg:px-10">
      <Logo href="/dashboard" compact className="lg:hidden" />
      <div className="flex min-w-0 flex-1 lg:justify-center xl:justify-start">
        <CommandPalette collapseOnPhone={trialEndsAt !== null} />
      </div>
      {trialEndsAt ? <TrialPill trialEndsAt={trialEndsAt} /> : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-5" strokeWidth={1.75} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <p className="px-4 py-6 text-[15px] text-muted-foreground">You&apos;re all caught up.</p>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Create new">
            <Plus className="size-5" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-semibold">Create</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <CalendarPlus /> Reservation
            <span className="ml-auto text-sm text-muted-foreground">Soon</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <UserPlus /> Guest
            <span className="ml-auto text-sm text-muted-foreground">Soon</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* On phones the account lives under the Menu tab. */}
      <div className="hidden lg:block">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
