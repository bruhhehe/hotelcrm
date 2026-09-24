import { CalendarX } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Book your stay", robots: { index: false } };

export default async function BookingWidgetPage({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        icon={CalendarX}
        title="Online booking isn't open yet"
        description="This property isn't taking online reservations through Lodgely yet. Please contact the hotel directly to book."
      />
    </div>
  );
}
