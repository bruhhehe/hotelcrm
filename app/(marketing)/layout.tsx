import Link from "next/link";
import { Logo } from "@/components/app-shell/logo";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <Logo />
        <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          {/* Below 400px the header can't fit both; the hero's primary CTA sits directly below. */}
          <Button asChild className="hidden min-[400px]:inline-flex">
            <Link href="/login">Start free trial</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Lodgely. Made for independent hotels.
      </footer>
    </div>
  );
}
