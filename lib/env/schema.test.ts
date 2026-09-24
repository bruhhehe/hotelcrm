import { describe, expect, it } from "vitest";
import { EnvValidationError, parseClientEnv, parseServerEnv } from "./schema";

describe("parseServerEnv", () => {
  it("accepts an empty environment (nothing configured)", () => {
    const env = parseServerEnv({});
    expect(env.NODE_ENV).toBe("development");
    expect(env.DATABASE_URL).toBeUndefined();
  });

  it("treats empty strings as unset", () => {
    const env = parseServerEnv({ DATABASE_URL: "", STRIPE_SECRET_KEY: "  " });
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.STRIPE_SECRET_KEY).toBeUndefined();
  });

  it("accepts well-formed values", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgresql://u:p@ep-x.eu-west-2.aws.neon.tech/lodgely?sslmode=require",
      AUTH_SECRET: "a".repeat(32),
      STRIPE_SECRET_KEY: "sk_test_123",
      RESEND_API_KEY: "re_123",
      EMAIL_FROM: "Lodgely <hello@lodgely.app>",
    });
    expect(env.EMAIL_FROM).toBe("Lodgely <hello@lodgely.app>");
  });

  it("rejects malformed values and lists every bad key", () => {
    try {
      parseServerEnv({
        DATABASE_URL: "mysql://nope",
        STRIPE_SECRET_KEY: "pk_test_123",
        AUTH_SECRET: "short",
      });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(EnvValidationError);
      const issues = (e as EnvValidationError).issues.join("\n");
      expect(issues).toContain("DATABASE_URL");
      expect(issues).toContain("STRIPE_SECRET_KEY");
      expect(issues).toContain("AUTH_SECRET");
    }
  });

  it("requires paired keys to be set together", () => {
    expect(() => parseServerEnv({ AUTH_GOOGLE_ID: "id" })).toThrow(/AUTH_GOOGLE_SECRET/);
    expect(() => parseServerEnv({ TWILIO_ACCOUNT_SID: "AC1", TWILIO_AUTH_TOKEN: "t" })).toThrow(
      /TWILIO_FROM/,
    );
    expect(() => parseServerEnv({ RESEND_API_KEY: "re_1" })).toThrow(/EMAIL_FROM/);
  });

  it("accepts a bare email for EMAIL_FROM and rejects junk", () => {
    expect(parseServerEnv({ RESEND_API_KEY: "re_1", EMAIL_FROM: "a@b.co" }).EMAIL_FROM).toBe(
      "a@b.co",
    );
    expect(() => parseServerEnv({ RESEND_API_KEY: "re_1", EMAIL_FROM: "not an email" })).toThrow(
      /EMAIL_FROM/,
    );
  });
});

describe("parseClientEnv", () => {
  it("defaults the app URL for local dev", () => {
    expect(parseClientEnv({}).NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("rejects a non-URL app URL", () => {
    expect(() => parseClientEnv({ NEXT_PUBLIC_APP_URL: "lodgely" })).toThrow(EnvValidationError);
  });
});
