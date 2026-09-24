import { describe, expect, it } from "vitest";
import { deploymentFrom, describeDeployment, strayDatabaseVariables } from "./deployment";

describe("deployment diagnostics", () => {
  it("reads Vercel's system variables", () => {
    const d = deploymentFrom({
      VERCEL_ENV: "preview",
      VERCEL_GIT_COMMIT_REF: "claude/fervent-gates-ud8evy",
      VERCEL_GIT_COMMIT_SHA: "2944b47aa1b2c3d4",
    });
    expect(d).toEqual({
      environment: "preview",
      branch: "claude/fervent-gates-ud8evy",
      commit: "2944b47",
    });
    expect(describeDeployment(d!)).toBe(
      "This is a Preview deployment of claude/fervent-gates-ud8evy (2944b47).",
    );
  });

  it("is null off Vercel and ignores malformed values", () => {
    expect(deploymentFrom({})).toBeNull();
    expect(deploymentFrom({ VERCEL_ENV: "staging" })).toBeNull();
    expect(describeDeployment(deploymentFrom({ VERCEL_ENV: "production" })!)).toBe(
      "This is a Production deployment.",
    );
  });

  it("spots a database connected under a prefix, by name only", () => {
    expect(
      strayDatabaseVariables({
        STORAGE_DATABASE_URL: "postgresql://secret",
        STORAGE_DATABASE_URL_UNPOOLED: "postgresql://secret",
        NEON_POSTGRES_URL: "postgresql://secret",
        DATABASE_URL: "postgresql://ok",
        POSTGRES_PRISMA_URL: "postgresql://ok",
        EMPTY_DATABASE_URL: "",
        MY_DATABASE_URL_HOST: "x",
      }),
    ).toEqual(["NEON_POSTGRES_URL", "STORAGE_DATABASE_URL", "STORAGE_DATABASE_URL_UNPOOLED"]);
  });
});
