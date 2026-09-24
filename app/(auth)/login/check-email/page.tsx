import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-10 text-center">
        <MailCheck className="mb-4 size-8 text-primary" strokeWidth={1.75} aria-hidden />
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          We&apos;ve sent you a sign-in link. It expires in 24 hours and can only be used once.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex min-h-11 items-center px-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Use a different email
        </Link>
      </CardContent>
    </Card>
  );
}
