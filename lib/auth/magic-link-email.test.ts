import { describe, expect, it } from "vitest";
import { magicLinkEmail } from "./magic-link-email";

describe("magicLinkEmail", () => {
  it("includes the link in both html and text", () => {
    const url = "https://app.lodgely.io/api/auth/callback/resend?token=abc&email=r%40x.com";
    const { html, text } = magicLinkEmail({ url, host: "app.lodgely.io" });
    expect(text).toContain(url);
    expect(html).toContain("token=abc&amp;email=r%40x.com");
  });

  it("escapes the host", () => {
    const { html } = magicLinkEmail({ url: "https://x", host: "<script>" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
