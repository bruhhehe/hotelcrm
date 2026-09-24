import { describe, expect, it } from "vitest";
import { adjustmentLabel, occupancyLabel, roomName, ruleLabel, scopeLabel } from "./labels";

describe("inventory labels", () => {
  it("prefixes numbered rooms only", () => {
    expect(roomName("7")).toBe("Room 7");
    expect(roomName("12A")).toBe("Room 12A");
    expect(roomName("Garden Cottage")).toBe("Garden Cottage");
  });

  it("describes occupancy", () => {
    expect(occupancyLabel(2, 2)).toBe("Sleeps 2");
    expect(occupancyLabel(2, 4)).toBe("Sleeps 2–4");
  });

  it("describes adjustments with a sign", () => {
    expect(adjustmentLabel({ type: "percentage", value: 2000 }, "GBP")).toBe("+20%");
    expect(adjustmentLabel({ type: "percentage", value: -1250 }, "GBP")).toBe("−12.5%");
    expect(adjustmentLabel({ type: "fixed", value: -1000 }, "GBP")).toBe("−£10 a night");
    expect(adjustmentLabel({ type: "override", value: 9950 }, "GBP")).toBe("Set to £99.50 a night");
  });

  it("describes rules and scopes", () => {
    expect(ruleLabel({ kind: "min_stay", minNights: 3 })).toBe("Minimum stay 3 nights");
    expect(ruleLabel({ kind: "closed_to_arrival", minNights: null })).toBe("No arrivals");
    const names = {
      roomTypes: new Map([["rt", "Classic Double"]]),
      ratePlans: new Map([["rp", "Bed & breakfast"]]),
    };
    expect(scopeLabel({ roomTypeId: null, ratePlanId: null }, names)).toBe("All rooms");
    expect(scopeLabel({ roomTypeId: "rt", ratePlanId: null }, names)).toBe("Classic Double");
    expect(scopeLabel({ roomTypeId: "rt", ratePlanId: "rp" }, names)).toBe(
      "Classic Double · Bed & breakfast",
    );
    expect(scopeLabel({ roomTypeId: "gone", ratePlanId: null }, names)).toBe("A deleted room type");
  });
});
