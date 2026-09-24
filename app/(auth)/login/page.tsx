import { Info, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import {
  getSession,
  isGoogleSignInAvailable,
  isLoggingSignInLinks,
  isMagicLinkAvailable,
} from "@/lib/auth";
import { signInWithGoogle } from "@/lib/auth/actions";
import { safeCallbackUrl } from "@/lib/auth/callback-url";
import { authErrorMessage } from "@/lib/auth/errors";
import { signInSetupSteps } from "@/lib/auth/setup-status";
import { env } from "@/lib/env/server";
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
  const production = env.NODE_ENV === "production";
  const setupSteps =
    magicLink || google
      ? []
      : signInSetupSteps({
          database: isConfigured("database"),
          authSecret: isConfigured("auth"),
          email: isConfigured("email"),
          google: isConfigured("googleAuth"),
          logLinks: env.AUTH_LOG_SIGN_IN_LINKS === "true",
          production,
        });
  const logLinksInProduction = production && magicLink && isLoggingSignInLinks();

  return (
    <Card className="overflow-hidden max-sm:rounded-none max-sm:border-0">
      <div className="flex h-16 items-center justify-center border-b px-6 max-sm:sr-only">
        <CardTitle as="h1" className="text-base font-bold">
          Sign in
        </CardTitle>
      </div>
      <CardContent className="flex flex-col gap-6 px-6 py-8 sm:px-8">
        <div>
          <h2 className="text-[22px] font-semibold">Welcome to Lodgely</h2>
          <CardDescription className="mt-1">
            No password needed. We&apos;ll email you a secure sign-in link.
          </CardDescription>
        </div>

        {errorMessage ? (
          <Banner variant="destructive">
            <TriangleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden />
            {errorMessage}
          </Banner>
        ) : null}

        {setupSteps.length > 0 ? (
          <Banner variant="warning">
            <TriangleAlert className="mt-0.5 size-[18px] shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Sign-in isn&apos;t connected yet</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5">
                {setupSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </Banner>
        ) : null}

        {logLinksInProduction ? (
          <Banner variant="info">
            <Info className="mt-0.5 size-[18px] shrink-0" aria-hidden />
            <p>
              Sign-in links are written to the server logs, not emailed. Turn off
              AUTH_LOG_SIGN_IN_LINKS once email is set up.
            </p>
          </Banner>
        ) : null}

        {magicLink ? <MagicLinkForm callbackUrl={callbackUrl} /> : null}

        {magicLink && google ? (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
        ) : null}

        {google ? (
          <form action={signInWithGoogle}>
            {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
            <Button type="submit" variant="outline" size="lg" className="relative w-full">
              <GoogleMark />
              Continue with Google
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="absolute left-5 size-5" aria-hidden>
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
