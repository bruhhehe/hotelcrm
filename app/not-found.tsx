import Link from "next/link";
import { Logo } from "@/components/app-shell/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4 py-16">
      <Logo className="mb-10" />
      <h1 className="text-[32px] leading-tight font-bold">We can&apos;t find that page</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        It may have moved, or the link might be mistyped.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
