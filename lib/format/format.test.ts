import { describe, expect, it } from "vitest";
import { greetingFor, longDate } from "./greeting";
import { firstNameFor, initialsFor } from "./names";

describe("initialsFor", () => {
  it("uses first and last name", () => {
    expect(initialsFor("Robert Fell", "robert@fellview.demo")).toBe("RF");
    expect(initialsFor("Anne Marie de Vries", "x@y.z")).toBe("AV");
  });

  it("falls back to the email", () => {
    expect(initialsFor(null, "robert@fellview.demo")).toBe("RO");
    expect(initialsFor("  ", "jane.doe@x.com")).toBe("JD");
  });
});

describe("firstNameFor", () => {
  it("prefers the name, then the email", () => {
    expect(firstNameFor("Robert Fell", "r@x.com")).toBe("Robert");
    expect(firstNameFor(null, "robert@fellview.demo")).toBe("Robert");
    expect(firstNameFor(null, "jane.doe@x.com")).toBe("Jane");
  });
});

describe("greetingFor", () => {
  const tz = "Europe/London";
  it("is time-of-day aware in the hotel's timezone", () => {
    // 07:30 UTC = 08:30 BST
    expect(greetingFor(new Date("2026-07-01T07:30:00Z"), tz)).toBe("Good morning");
    expect(greetingFor(new Date("2026-07-01T13:00:00Z"), tz)).toBe("Good afternoon");
    expect(greetingFor(new Date("2026-07-01T20:00:00Z"), tz)).toBe("Good evening");
    expect(greetingFor(new Date("2026-07-01T01:00:00Z"), tz)).toBe("Good evening");
  });

  it("uses the hotel's timezone, not the server's", () => {
    // 11:30 UTC is morning in New York
    expect(greetingFor(new Date("2026-07-01T11:30:00Z"), "America/New_York")).toBe("Good morning");
    expect(greetingFor(new Date("2026-07-01T11:30:00Z"), "Asia/Tokyo")).toBe("Good evening");
  });
});

describe("longDate", () => {
  it("formats in the hotel's timezone", () => {
    expect(longDate(new Date("2026-09-24T23:30:00Z"), "Europe/London")).toBe(
      "Friday 25 September 2026",
    );
  });
});
