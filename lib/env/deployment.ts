import { z } from "zod";

/*
 * What a deployment can say about itself when sign-in isn't set up, so an operator can tell
 * which Vercel environment is missing variables. Only variable *names* are ever reported,
 * never values.
 */

const vercelSystemEnv = z.object({
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional().catch(undefined),
  VERCEL_GIT_COMMIT_REF: z.string().min(1).optional().catch(undefined),
  VERCEL_GIT_COMMIT_SHA: z.string().min(7).optional().catch(undefined),
});

export type Deployment = {
  environment: "production" | "preview" | "development";
  branch: string | null;
  commit: string | null;
};

/** Vercel's system variables, or null when not running on Vercel. */
export function deploymentFrom(env: Record<string, string | undefined>): Deployment | null {
  const v = vercelSystemEnv.parse(env);
  if (!v.VERCEL_ENV) return null;
  return {
    environment: v.VERCEL_ENV,
    branch: v.VERCEL_GIT_COMMIT_REF ?? null,
    commit: v.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  };
}

const ENVIRONMENT_LABEL: Record<Deployment["environment"], string> = {
  production: "Production",
  preview: "Preview",
  development: "Development",
};

export function environmentLabel(d: Deployment): string {
  return ENVIRONMENT_LABEL[d.environment];
}

/** "This is a Preview deployment of claude/x (2944b47)." */
export function describeDeployment(d: Deployment): string {
  const branch = d.branch ? ` of ${d.branch}` : "";
  const commit = d.commit ? ` (${d.commit})` : "";
  return `This is a ${environmentLabel(d)} deployment${branch}${commit}.`;
}

/** Database variable names the app reads directly, or that Neon/Vercel set alongside them. */
const KNOWN_DATABASE_VARIABLES = new Set([
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_NO_SSL",
  "POSTGRES_PRISMA_URL",
  "TEST_DATABASE_URL",
]);

const DATABASE_VARIABLE = /(?:^|_)(?:DATABASE_URL|POSTGRES_URL)(?:_UNPOOLED|_NON_POOLING)?$/;

/**
 * Names of set variables that look like a database URL under a name the app doesn't read, such
 * as STORAGE_DATABASE_URL when Vercel connected the database with a custom prefix.
 */
export function strayDatabaseVariables(env: Record<string, string | undefined>): string[] {
  return Object.keys(env)
    .filter((k) => DATABASE_VARIABLE.test(k) && !KNOWN_DATABASE_VARIABLES.has(k) && env[k]?.trim())
    .sort();
}
