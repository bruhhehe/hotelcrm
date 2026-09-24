import { describe, expect, it } from "vitest";
import { parseHotelSettings } from "./settings";

describe("parseHotelSettings", () => {
  it("fills every default from an empty object", () => {
    const s = parseHotelSettings({});
    expect(s.depositPolicy).toEqual({
      type: "percentage",
      value: 3000,
      balanceDue: "on_arrival",
      daysBefore: 7,
    });
    expect(s.requireValidation).toBe(false);
    expect(s.automaticEmails.events.postStay).toBe(true);
    expect(s.portal.magicLinkDays).toBe(7);
  });

  it("treats null as empty (hotel created before settings existed)", () => {
    expect(parseHotelSettings(null).defaultMinNights).toBe(1);
  });

  it("keeps stored values and fills only what is missing", () => {
    const s = parseHotelSettings({ depositPolicy: { type: "fixed", value: 5000 } });
    expect(s.depositPolicy).toMatchObject({ type: "fixed", value: 5000, balanceDue: "on_arrival" });
  });

  it("rejects malformed values", () => {
    expect(() => parseHotelSettings({ depositPolicy: { value: -1 } })).toThrow();
    expect(() => parseHotelSettings({ widget: { themeColor: "green" } })).toThrow();
  });
});
