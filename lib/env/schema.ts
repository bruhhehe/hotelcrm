import { z } from "zod";

/**
 * Pure env schemas — no side effects, safe to import from tests.
 * Every integration key is optional: a missing key means "not configured" and the
 * UI shows a friendly connect state (see lib/integrations.ts). Keys that ARE set
 * must be well-formed, and paired keys must be set together.
 */

/** Vercel and .env files often leave keys as "" — treat that as unset. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    schema.optional(),
  );

const postgresUrl = z
  .string()
  .regex(/^postgres(ql)?:\/\//, "must be a postgres:// or postgresql:// connection string");

/** Accepts `hello@x.com` or `Lodgely <hello@x.com>`. */
const emailFrom = z
  .string()
  .regex(
    /^(?:[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/,
    "must be an email address, optionally as `Name <email>`",
  );

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    DATABASE_URL: optional(postgresUrl),
    /** Direct (non-pooled) connection, used for migrations. Neon's integration sets it. */
    DATABASE_URL_UNPOOLED: optional(postgresUrl),
    /** Also set by Vercel's Neon/Postgres integration; used when DATABASE_URL is absent. */
    POSTGRES_URL: optional(postgresUrl),
    POSTGRES_URL_NON_POOLING: optional(postgresUrl),

    AUTH_SECRET: optional(
      z.string().min(32, "must be at least 32 characters (run `npx auth secret`)"),
    ),
    /**
     * "true" writes staff sign-in links to the server logs when no email provider is configured,
     * so an operator can sign in to a fresh deployment. Anyone who can read the logs can sign in
     * as anyone: turn it off before real users arrive.
     */
    AUTH_LOG_SIGN_IN_LINKS: optional(z.enum(["true", "false"])),
    AUTH_GOOGLE_ID: optional(z.string()),
    AUTH_GOOGLE_SECRET: optional(z.string()),

    STRIPE_SECRET_KEY: optional(
      z
        .string()
        .regex(/^(sk|rk)_(test|live)_/, "must start with sk_test_, sk_live_, rk_test_ or rk_live_"),
    ),
    STRIPE_WEBHOOK_SECRET: optional(z.string().startsWith("whsec_")),
    STRIPE_CONNECT_CLIENT_ID: optional(z.string().startsWith("ca_")),

    RESEND_API_KEY: optional(z.string().startsWith("re_")),
    EMAIL_FROM: optional(emailFrom),

    TWILIO_ACCOUNT_SID: optional(z.string().startsWith("AC")),
    TWILIO_AUTH_TOKEN: optional(z.string()),
    TWILIO_FROM: optional(z.string()),

    BLOB_READ_WRITE_TOKEN: optional(z.string()),

    GOOGLE_CALENDAR_CLIENT_ID: optional(z.string()),
    GOOGLE_CALENDAR_CLIENT_SECRET: optional(z.string()),

    CRON_SECRET: optional(z.string().min(16, "must be at least 16 characters")),
  })
  .superRefine((env, ctx) => {
    const pairs: ReadonlyArray<readonly (keyof typeof env)[]> = [
      ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
      ["RESEND_API_KEY", "EMAIL_FROM"],
      ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM"],
      ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CALENDAR_CLIENT_SECRET"],
    ];
    for (const group of pairs) {
      const set = group.filter((k) => env[k] !== undefined);
      if (set.length > 0 && set.length < group.length) {
        for (const k of group.filter((k) => env[k] === undefined)) {
          ctx.addIssue({
            code: "custom",
            path: [k],
            message: `must be set together with ${set.join(", ")}`,
          });
        }
      }
    }
  });

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_GOOGLE_PLACES_KEY: optional(z.string()),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

export class EnvValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid environment variables:\n${issues.map((i) => `  - ${i}`).join("\n")}`);
    this.name = "EnvValidationError";
  }
}

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}

export function parseServerEnv(raw: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(raw);
  if (!result.success) throw new EnvValidationError(formatIssues(result.error));
  return result.data;
}

export function parseClientEnv(raw: Record<string, string | undefined>): ClientEnv {
  const result = clientEnvSchema.safeParse(raw);
  if (!result.success) throw new EnvValidationError(formatIssues(result.error));
  return result.data;
}
