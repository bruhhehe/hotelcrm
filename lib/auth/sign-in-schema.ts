import { z } from "zod";

/** Normalise first (trim, lowercase), then validate — pasted addresses often carry spaces. */
export const signInEmailSchema = z
  .string({ error: "Enter your email address" })
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address")
  .pipe(z.email("That doesn't look like an email address. Check it and try again."));

export type SignInState = { error?: string; email?: string };
