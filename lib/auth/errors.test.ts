import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./errors";

describe("authErrorMessage", () => {
  it("returns null without an error", () => {
    expect(authErrorMessage(undefined)).toBeNull();
  });

  it("explains expired links", () => {
    expect(authErrorMessage("Verification")).toMatch(/expired/);
  });

  it("has a generic fallback", () => {
    expect(authErrorMessage("SomethingNew")).toMatch(/couldn't sign you in/);
  });
});
