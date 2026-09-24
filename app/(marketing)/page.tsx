import Link from "next/link";
import { Button } from "@/components/ui/button";

// Placeholder hero. The full marketing site (pricing, comparison, product tour) is Phase 15.
export default function HomePage() {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-14 pb-24 text-center sm:px-6 sm:pt-24">
      <h1 className="text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.05] font-semibold">
        Run your hotel in one place — every booking, every guest, every channel.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        Reservations, guests, rooms, payments and housekeeping for independent hotels. Built by
        hoteliers who&apos;d rather greet guests than fight spreadsheets.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/login">Start your 30-day free trial</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">No card needed to start.</p>
    </section>
  );
}
