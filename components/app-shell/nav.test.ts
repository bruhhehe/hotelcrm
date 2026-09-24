import { describe, expect, it } from "vitest";
import { isActivePath, NAV_ITEMS } from "./nav";

describe("NAV_ITEMS", () => {
  it("matches the spec's sidebar order", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Dashboard",
      "Calendar",
      "Availability",
      "Reservations",
      "Housekeeping",
      "Guests",
      "Data",
      "Settings",
    ]);
  });
});

describe("isActivePath", () => {
  it("matches the section and its children only", () => {
    expect(isActivePath("/reservations", "/reservations")).toBe(true);
    expect(isActivePath("/reservations/abc", "/reservations")).toBe(true);
    expect(isActivePath("/reservations-archive", "/reservations")).toBe(false);
    expect(isActivePath("/data/analytics", "/dashboard")).toBe(false);
  });
});
