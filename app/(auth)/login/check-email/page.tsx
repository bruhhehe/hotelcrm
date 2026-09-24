import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-10 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <MailCheck className="size-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          We&apos;ve sent you a sign-in link. It expires in 24 hours and can only be used once.
        </p>
        <Link href="/login" className="mt-6 text-sm font-semibold text-primary hover:underline">
          Use a different email
        </Link>
      </CardContent>
    </Card>
  );
}
