import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <Card className="overflow-hidden max-sm:rounded-none max-sm:border-0">
      <div className="flex h-16 items-center justify-center border-b px-6 max-sm:sr-only">
        <CardTitle as="h1" className="text-base font-bold">
          Check your email
        </CardTitle>
      </div>
      <CardContent className="px-6 py-8 sm:px-8">
        <h2 className="text-[22px] font-semibold">Your sign-in link is on its way</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Open the email from Lodgely and select the link to sign in. It expires in 24 hours and can
          only be used once.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-11 items-center text-[15px] font-semibold underline underline-offset-4"
        >
          Use a different email
        </Link>
      </CardContent>
    </Card>
  );
}
