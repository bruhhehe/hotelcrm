import { Users } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export const metadata: Metadata = { title: "Guests" };

export default function GuestsPage() {
  return (
    <ComingSoon
      title="Guests"
      icon={Users}
      description="Profiles, companions, preferences and documents for everyone who stays."
      what="Guests are added when they book, or you can import them from a spreadsheet."
    />
  );
}
