import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export const metadata: Metadata = { title: "Housekeeping" };

export default function HousekeepingPage() {
  return (
    <ComingSoon
      title="Housekeeping"
      icon={Sparkles}
      description="Today's cleaning board, room status and maintenance issues."
      what="Cleaning tasks are generated automatically from departures and stayovers once reservations exist."
    />
  );
}
