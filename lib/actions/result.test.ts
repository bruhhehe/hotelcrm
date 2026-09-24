import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fieldErrorsFrom, formObject } from "./result";

describe("formObject", () => {
  it("keeps single values, collects repeated and [] keys, drops action ids", () => {
    const fd = new FormData();
    fd.append("name", "Classic");
    fd.append("roomTypeIds", "a");
    fd.append("roomTypeIds", "b");
    fd.append("weekdays[]", "0");
    fd.append("$ACTION_ID_abc", "");
    expect(formObject(fd)).toEqual({ name: "Classic", roomTypeIds: ["a", "b"], weekdays: ["0"] });
  });
});

describe("fieldErrorsFrom", () => {
  it("keeps the first message per field", () => {
    const result = z
      .object({ name: z.string().min(2, "Too short").max(1), n: z.number() })
      .safeParse({ name: "x", n: "1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrorsFrom(result.error);
      expect(errors.name).toBe("Too short");
      expect(errors.n).toBeDefined();
    }
  });
});
