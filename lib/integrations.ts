import "server-only";
import { env } from "@/lib/env/server";
import { clientEnv } from "@/lib/env/client";

/**
 * Every third-party integration exposes `isConfigured()`. Screens that depend on one
 * must check it and render <NotConfigured /> instead of throwing.
 */
export type IntegrationKey =
  | "database"
  | "auth"
  | "googleAuth"
  | "email"
  | "stripe"
  | "stripeConnect"
  | "sms"
  | "blob"
  | "places"
  | "googleCalendar"
  | "cron";

export type Integration = {
  key: IntegrationKey;
  label: string;
  description: string;
  /** Where a hotel owner (or the operator, for platform keys) goes to fix it. */
  settingsHref: string;
  isConfigured: () => boolean;
};

export const integrations: Record<IntegrationKey, Integration> = {
  database: {
    key: "database",
    label: "Database",
    description: "Postgres on Neon. Set DATABASE_URL.",
    settingsHref: "/settings",
    isConfigured: () => env.DATABASE_URL !== undefined,
  },
  auth: {
    key: "auth",
    label: "Sign-in",
    description: "Auth.js session signing. Set AUTH_SECRET.",
    settingsHref: "/settings",
    // Auth.js refuses to run without a secret in every environment, dev included.
    isConfigured: () => env.AUTH_SECRET !== undefined,
  },
  googleAuth: {
    key: "googleAuth",
    label: "Google sign-in",
    description: "Sign in with Google. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.",
    settingsHref: "/settings",
    isConfigured: () => env.AUTH_GOOGLE_ID !== undefined && env.AUTH_GOOGLE_SECRET !== undefined,
  },
  email: {
    key: "email",
    label: "Email (Resend)",
    description: "Transactional email to guests and staff.",
    settingsHref: "/settings/emails",
    isConfigured: () => env.RESEND_API_KEY !== undefined && env.EMAIL_FROM !== undefined,
  },
  stripe: {
    key: "stripe",
    label: "Stripe",
    description: "Online deposits, balances and refunds.",
    settingsHref: "/settings/payments",
    isConfigured: () => env.STRIPE_SECRET_KEY !== undefined,
  },
  stripeConnect: {
    key: "stripeConnect",
    label: "Stripe Connect",
    description: "Lets each hotel connect its own Stripe account.",
    settingsHref: "/settings/payments",
    isConfigured: () =>
      env.STRIPE_SECRET_KEY !== undefined && env.STRIPE_CONNECT_CLIENT_ID !== undefined,
  },
  sms: {
    key: "sms",
    label: "SMS (Twilio)",
    description: "Text-message reminders and confirmations.",
    settingsHref: "/settings/sms",
    isConfigured: () =>
      env.TWILIO_ACCOUNT_SID !== undefined &&
      env.TWILIO_AUTH_TOKEN !== undefined &&
      env.TWILIO_FROM !== undefined,
  },
  blob: {
    key: "blob",
    label: "File storage",
    description: "Guest documents, room photos and ID scans (Vercel Blob).",
    settingsHref: "/settings",
    isConfigured: () => env.BLOB_READ_WRITE_TOKEN !== undefined,
  },
  places: {
    key: "places",
    label: "Address autocomplete",
    description: "Google Places address lookup on guest forms.",
    settingsHref: "/settings",
    isConfigured: () => clientEnv.NEXT_PUBLIC_GOOGLE_PLACES_KEY !== undefined,
  },
  googleCalendar: {
    key: "googleCalendar",
    label: "Google Calendar",
    description: "One-way sync of reservations to staff calendars.",
    settingsHref: "/settings/team",
    isConfigured: () =>
      env.GOOGLE_CALENDAR_CLIENT_ID !== undefined &&
      env.GOOGLE_CALENDAR_CLIENT_SECRET !== undefined,
  },
  cron: {
    key: "cron",
    label: "Scheduled jobs",
    description: "Reminders, housekeeping generation and daily stats. Set CRON_SECRET.",
    settingsHref: "/settings",
    isConfigured: () => env.CRON_SECRET !== undefined,
  },
};

export function isConfigured(key: IntegrationKey): boolean {
  return integrations[key].isConfigured();
}
