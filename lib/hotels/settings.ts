import { z } from "zod";

/**
 * Per-hotel settings stored as JSON on `hotels.settings`. Parsed with defaults on read, so a
 * hotel created before a setting existed still gets a sensible value, and adding a setting
 * never needs a data migration.
 */
export const depositPolicySchema = z.object({
  /** "percentage": value is basis points of the total (3000 = 30%). "fixed": value in minor units. */
  type: z.enum(["none", "percentage", "fixed"]).default("percentage"),
  value: z.int().min(0).default(3000),
  balanceDue: z.enum(["on_arrival", "days_before"]).default("on_arrival"),
  /** Used when balanceDue is "days_before". */
  daysBefore: z.int().min(1).max(90).default(7),
});

export const automaticEmailsSchema = z.object({
  toTeam: z.boolean().default(true),
  toGuests: z.boolean().default(true),
  events: z
    .object({
      newReservation: z.boolean().default(true),
      reservationPaid: z.boolean().default(true),
      refund: z.boolean().default(true),
      confirmation: z.boolean().default(true),
      preArrival: z.boolean().default(true),
      paymentInvite: z.boolean().default(true),
      receipt: z.boolean().default(true),
      postStay: z.boolean().default(true),
    })
    .prefault({}),
});

export const hotelSettingsSchema = z.object({
  depositPolicy: depositPolicySchema.prefault({}),
  /** Widget and portal bookings arrive as pending_validation until staff confirm them. */
  requireValidation: z.boolean().default(false),
  /** Hotel-wide minimum stay in nights; room types and rate plans can require more. */
  defaultMinNights: z.int().min(1).max(30).default(1),
  /** Show prices with tax included (UK/EU) or added on top (North America). */
  displayTaxIncluded: z.boolean().default(true),
  automaticEmails: automaticEmailsSchema.prefault({}),
  portal: z
    .object({
      enabled: z.boolean().default(true),
      welcomeText: z.string().max(2000).default(""),
      magicLinkDays: z.int().min(1).max(30).default(7),
    })
    .prefault({}),
  widget: z
    .object({
      enabled: z.boolean().default(false),
      themeColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    })
    .prefault({}),
});

export type HotelSettings = z.infer<typeof hotelSettingsSchema>;
export type HotelSettingsInput = z.input<typeof hotelSettingsSchema>;

/** Parse stored settings, filling defaults. Unknown keys are dropped. */
export function parseHotelSettings(raw: unknown): HotelSettings {
  return hotelSettingsSchema.parse(raw ?? {});
}

export const SUPPORTED_CURRENCIES = ["GBP", "EUR", "USD", "CAD"] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const SUPPORTED_LOCALES = ["en", "fr", "de", "nl", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
