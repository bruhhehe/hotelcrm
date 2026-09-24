import { CreditCard } from "lucide-react";
import type { Metadata } from "next";
import { ComingSoon } from "@/components/app-shell/coming-soon";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <ComingSoon
      title="Billing"
      icon={CreditCard}
      description="Your Lodgely plan, trial and invoices."
      what="Plans and invoices appear here once your hotel's subscription is set up. Every new hotel starts with a 30-day free trial, no card needed."
    />
  );
}
