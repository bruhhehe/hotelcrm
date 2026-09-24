import type { Metadata } from "next";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export const metadata: Metadata = { title: "Availability" };

export default function AvailabilityPage() {
  return (
    <ComingSoon
      title="Availability"
      description="Room types, rates, capacity overrides, price adjustments and stay rules."
      what="Add your room types and rate plans to start managing availability."
    />
  );
}
