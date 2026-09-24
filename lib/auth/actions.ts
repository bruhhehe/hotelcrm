"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { safeCallbackUrl } from "./callback-url";
import { MAGIC_LINK_PROVIDER_ID, signIn, signOut } from "./index";
import { signInEmailSchema, type SignInState } from "./sign-in-schema";

export async function signInWithEmail(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const submitted = formData.get("email");
  const email = typeof submitted === "string" ? submitted : "";
  const parsed = signInEmailSchema.safeParse(submitted);
  // Echo the input back: React resets uncontrolled fields after an action, so the form
  // restores it from state instead of making the user retype it.
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email };

  const callbackUrl = formData.get("callbackUrl");

  try {
    // redirect: false — otherwise Next.js follows Auth.js's /api/auth/verify-request hop as a
    // soft navigation and the address bar ends up showing the API URL.
    await signIn(MAGIC_LINK_PROVIDER_ID, {
      email: parsed.data,
      redirectTo: safeCallbackUrl(typeof callbackUrl === "string" ? callbackUrl : undefined),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("Magic link sign-in failed", error);
      return {
        error: "We couldn't send your sign-in link just now. Please try again in a minute.",
        email,
      };
    }
    throw error;
  }
  redirect("/login/check-email");
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const callbackUrl = formData.get("callbackUrl");
  await signIn("google", {
    redirectTo: safeCallbackUrl(typeof callbackUrl === "string" ? callbackUrl : undefined),
  });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
