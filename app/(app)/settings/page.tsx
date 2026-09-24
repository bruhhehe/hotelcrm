import { Settings } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      icon={Settings}
      description="Hotel details, rooms, rates, payments, emails, team and billing."
      what="Hotel settings become available once your hotel is created."
    />
  );
}
