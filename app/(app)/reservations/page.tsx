import type { Metadata } from "next";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export const metadata: Metadata = { title: "Reservations" };

export default function ReservationsPage() {
  return (
    <ComingSoon
      title="Reservations"
      description="Every booking from every channel, in one list."
      what="Reservations from your widget, OTAs, phone and walk-ins will be listed here."
    />
  );
}
