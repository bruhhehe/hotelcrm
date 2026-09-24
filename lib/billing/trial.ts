const DAY_MS = 24 * 60 * 60 * 1000;

export const TRIAL_LENGTH_DAYS = 30;

export function trialEndsAtFrom(start: Date): Date {
  return new Date(start.getTime() + TRIAL_LENGTH_DAYS * DAY_MS);
}

/**
 * Whole days left in the trial, rounded up so the last partial day reads "1 day left"
 * rather than "0 days left". Never negative.
 */
export function trialDaysLeft(trialEndsAt: Date, now: Date): number {
  const remaining = trialEndsAt.getTime() - now.getTime();
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / DAY_MS);
}

export function trialLabel(daysLeft: number): string {
  if (daysLeft <= 0) return "Trial ended";
  return daysLeft === 1 ? "1 day left" : `${daysLeft} days left`;
}
