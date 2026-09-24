import { describe, expect, it } from "vitest";
import { signInEmailSchema } from "./sign-in-schema";

describe("signInEmailSchema", () => {
  it("trims and lowercases before validating", () => {
    expect(signInEmailSchema.parse("  Robert@FellView.demo \n")).toBe("robert@fellview.demo");
  });

  it("asks for an email when empty", () => {
    const r = signInEmailSchema.safeParse("   ");
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe("Enter your email address");
  });

  it("explains an invalid address", () => {
    const r = signInEmailSchema.safeParse("robert@");
    expect(r.error?.issues[0]?.message).toMatch(/doesn't look like an email/);
  });

  it("rejects a missing field", () => {
    expect(signInEmailSchema.safeParse(null).success).toBe(false);
  });
});
