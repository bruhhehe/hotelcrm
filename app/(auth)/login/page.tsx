import { TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession, isGoogleSignInAvailable, isMagicLinkAvailable } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/auth/actions";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { authErrorMessage } from "@/lib/auth/errors";
import { isConfigured } from "@/lib/integrations";
import { MagicLinkForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  const session = await getSession();
  if (session?.user) redirect(safeCallbackUrl(callbackUrl));

  const magicLink = isMagicLinkAvailable();
  const google = isGoogleSignInAvailable();
  const errorMessage = authErrorMessage(error);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign in to Lodgely</CardTitle>
        <CardDescription>No password needed — we&apos;ll email you a secure link.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {errorMessage ? (
          <Banner variant="destructive">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {errorMessage}
          </Banner>
        ) : null}

        {!magicLink && !google ? (
          <Banner variant="warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Sign-in isn&apos;t connected yet</p>
              <p className="mt-1">
                {!isConfigured("database")
                  ? "Connect a database (DATABASE_URL) to enable sign-in. On Vercel: Storage → Neon."
                  : !isConfigured("auth")
                    ? "Set AUTH_SECRET (generate one with `npx auth secret`) to enable sign-in."
                    : "Connect Resend (RESEND_API_KEY and EMAIL_FROM) or Google (AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET) to enable sign-in."}
              </p>
            </div>
          </Banner>
        ) : null}

        {magicLink ? <MagicLinkForm callbackUrl={callbackUrl} /> : null}

        {magicLink && google ? (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
        ) : null}

        {google ? (
          <form action={signInWithGoogle}>
            {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
            <Button type="submit" variant="outline" size="lg" className="w-full">
              <GoogleMark /> Continue with Google
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
