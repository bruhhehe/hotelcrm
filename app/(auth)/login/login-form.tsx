"use client";

import { Mail } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithEmail } from "@/lib/auth/actions";
import type { SignInState } from "@/lib/auth/sign-in-schema";

export function MagicLinkForm({ callbackUrl }: { callbackUrl: string | undefined }) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signInWithEmail, {});

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      <Label htmlFor="email">Work email</Label>
      <Input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="you@yourhotel.com"
        defaultValue={state.email}
        required
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "email-error" : undefined}
      />
      {state.error ? (
        <p id="email-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="mt-1">
        <Mail /> {pending ? "Sending link…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
