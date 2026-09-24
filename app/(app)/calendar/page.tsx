import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <ComingSoon
      title="Calendar"
      icon={CalendarDays}
      description="Every reservation on a tape chart — rooms down the side, dates across the top."
      what="The tape chart appears once you have rooms and reservations."
    />
  );
}
