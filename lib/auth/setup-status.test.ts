import { describe, expect, it } from "vitest";
import { signInSetupSteps } from "./setup-status";

const ready = {
  database: true,
  authSecret: true,
  email: true,
  google: false,
  logLinks: false,
  production: true,
};

describe("signInSetupSteps", () => {
  it("is empty when sign-in works", () => {
    expect(signInSetupSteps(ready)).toEqual([]);
    expect(signInSetupSteps({ ...ready, email: false, google: true })).toEqual([]);
    expect(signInSetupSteps({ ...ready, email: false, logLinks: true })).toEqual([]);
  });

  it("lists every missing piece on a fresh deployment, then the redeploy", () => {
    const steps = signInSetupSteps({
      database: false,
      authSecret: false,
      email: false,
      google: false,
      logLinks: false,
      production: true,
    });
    expect(steps).toHaveLength(4);
    expect(steps[0]).toMatch(/DATABASE_URL/);
    expect(steps[1]).toMatch(/AUTH_SECRET/);
    expect(steps[2]).toMatch(/AUTH_LOG_SIGN_IN_LINKS/);
    expect(steps[3]).toMatch(/Redeploy/);
  });

  it("doesn't ask for email in development (links print to the console)", () => {
    expect(signInSetupSteps({ ...ready, email: false, production: false })).toEqual([]);
  });

  it("names the Vercel environment that's missing the database", () => {
    const [first, second] = signInSetupSteps({
      ...ready,
      database: false,
      authSecret: false,
      deployment: { environment: "preview", branch: "feature", commit: "abc1234" },
    });
    expect(first).toMatch(/DATABASE_URL for the Preview environment/);
    expect(second).toMatch(/AUTH_SECRET for the Preview environment/);
  });

  it("explains a database connected under a custom prefix", () => {
    const [first] = signInSetupSteps({
      ...ready,
      database: false,
      strayDatabaseVariables: ["STORAGE_DATABASE_URL"],
    });
    expect(first).toMatch(/Found STORAGE_DATABASE_URL but no DATABASE_URL/);
  });
});
