import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Your stays", robots: { index: false } };

export default async function GuestAccountPage({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        icon={UserRound}
        title="Guest accounts aren't available yet"
        description="Soon you'll be able to see your upcoming stays, pay securely and download invoices here."
      />
    </div>
  );
}
