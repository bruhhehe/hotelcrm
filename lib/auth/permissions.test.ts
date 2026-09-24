import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("role permissions", () => {
  it("lets owners and managers manage inventory", () => {
    expect(can("owner", "inventory.manage")).toBe(true);
    expect(can("manager", "inventory.manage")).toBe(true);
  });

  it("lets reception and read-only staff see availability but not change it", () => {
    for (const role of ["reception", "readonly"] as const) {
      expect(can(role, "inventory.view")).toBe(true);
      expect(can(role, "inventory.manage")).toBe(false);
      expect(can(role, "settings.view")).toBe(false);
    }
  });

  it("keeps housekeeping to the housekeeping board", () => {
    expect(can("housekeeping", "inventory.view")).toBe(false);
    expect(can("housekeeping", "settings.view")).toBe(false);
  });
});
