import { parseClientEnv } from "./schema";

/**
 * NEXT_PUBLIC_* vars must be referenced literally so Next.js can inline them at build time.
 */
export const clientEnv = parseClientEnv({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_GOOGLE_PLACES_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY,
});
