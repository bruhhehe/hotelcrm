import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Constant-time compare;
 * an unset secret always rejects so cron routes are never open by accident.
 */
export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  cronSecret: string | undefined,
): boolean {
  if (!cronSecret || !authorizationHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const actual = Buffer.from(authorizationHeader);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
