import type { Route } from "next";

export const DEFAULT_AFTER_SIGN_IN: Route = "/dashboard";

/**
 * Only allow same-origin relative paths as post-sign-in redirects. Rejects protocol-relative
 * (`//evil.com`) and backslash (`/\evil.com`, which browsers normalise to `//`) forms.
 */
export function safeCallbackUrl(url: string | null | undefined): Route {
  if (!url || !url.startsWith("/") || url.startsWith("//") || url.includes("\\")) {
    return DEFAULT_AFTER_SIGN_IN;
  }
  // Validated as a same-origin path above; typed routes can't check runtime strings.
  return url as Route;
}
