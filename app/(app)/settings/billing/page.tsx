import type { Metadata } from "next";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <ComingSoon
      title="Billing"
      description="Your Lodgely plan, trial and invoices."
      what="Your plan, trial and invoices will appear here. Every new hotel starts with a 30-day free trial, no card needed."
    />
  );
}
