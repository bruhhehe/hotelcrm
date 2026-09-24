"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeCallbackUrl } from "./callback-url";
import { MAGIC_LINK_PROVIDER_ID, signIn, signOut } from "./index";

const emailSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  callbackUrl: z.string().optional(),
});

export type SignInState = { error?: string };

export async function signInWithEmail(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    callbackUrl: formData.get("callbackUrl") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid email" };

  try {
    // redirect: false — otherwise Next.js follows Auth.js's /api/auth/verify-request hop as a
    // soft navigation and the address bar ends up showing the API URL.
    await signIn(MAGIC_LINK_PROVIDER_ID, {
      email: parsed.data.email,
      redirectTo: safeCallbackUrl(parsed.data.callbackUrl),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      console.error("Magic link sign-in failed", error);
      return { error: "We couldn't send your sign-in link. Please try again in a moment." };
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
