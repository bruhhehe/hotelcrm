import { describe, expect, it } from "vitest";
import { DEFAULT_AFTER_SIGN_IN, safeCallbackUrl } from "./callback-url";

describe("safeCallbackUrl", () => {
  it("keeps same-origin paths", () => {
    expect(safeCallbackUrl("/reservations?status=pending")).toBe("/reservations?status=pending");
  });

  it.each([
    undefined,
    null,
    "",
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
  ])("falls back to the dashboard for %s", (input) => {
    expect(safeCallbackUrl(input)).toBe(DEFAULT_AFTER_SIGN_IN);
  });
});
