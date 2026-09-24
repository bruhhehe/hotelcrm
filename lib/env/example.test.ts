import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { describe, expect, it } from "vitest";
import { parseClientEnv, parseServerEnv, serverEnvSchema } from "./schema";

const example = parse(readFileSync(new URL("../../.env.example", import.meta.url)));

describe(".env.example", () => {
  it("parses as-is, so copying it never breaks boot", () => {
    expect(() => parseServerEnv(example)).not.toThrow();
    expect(() => parseClientEnv(example)).not.toThrow();
  });

  it("documents every server key", () => {
    const documented = new Set(Object.keys(example));
    const missing = Object.keys(serverEnvSchema.shape).filter(
      (k) => k !== "NODE_ENV" && !documented.has(k),
    );
    expect(missing).toEqual([]);
  });
});
