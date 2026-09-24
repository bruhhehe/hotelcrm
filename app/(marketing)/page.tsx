import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Placeholder hero. The full marketing site (pricing, comparison, product tour) is Phase 15.
export default function HomePage() {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-16 pb-24 text-center sm:px-6 sm:pt-24">
      <p className="mb-4 micro-label">Hotel management for independents</p>
      <h1 className="text-4xl leading-[1.05] font-semibold sm:text-6xl">
        Run your hotel in one place — every booking, every guest, every channel.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        Reservations, guests, rooms, payments and housekeeping for independent hotels. Built by
        hoteliers who&apos;d rather greet guests than fight spreadsheets.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/login">Start your 30-day free trial</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {["No card required", "Set up in an afternoon", "Cancel anytime"].map((item) => (
          <li key={item} className="flex items-center gap-1.5">
            <Check className="size-4 text-primary" aria-hidden /> {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
