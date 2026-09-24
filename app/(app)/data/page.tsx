import type { Metadata } from "next";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export const metadata: Metadata = { title: "Data" };

export default function DataPage() {
  return (
    <ComingSoon
      title="Data"
      description="Analytics, exports and imports."
      what="Occupancy, ADR, RevPAR and revenue reports appear once reservations exist."
    />
  );
}
