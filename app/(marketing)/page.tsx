import Link from "next/link";
import { Button } from "@/components/ui/button";

// Placeholder hero. The full marketing site (pricing, comparison, product tour) is Phase 15.
export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6 sm:pt-28 lg:px-10">
      <div className="max-w-[46rem]">
        <h1 className="text-[clamp(2.25rem,4.6vw,3.5rem)] leading-[1.05] font-extrabold tracking-[-0.035em]">
          Run your hotel in one place{"\u00a0"}— every booking, every guest, every channel.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Reservations, guests, rooms, payments and housekeeping for independent hotels. Built by
          hoteliers who&apos;d rather greet guests than fight spreadsheets.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">Start your 30-day free trial</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
        <p className="mt-4 text-[15px] text-muted-foreground">No card needed to start.</p>
      </div>
    </section>
  );
}
