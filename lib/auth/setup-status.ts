import { type Deployment, environmentLabel } from "@/lib/env/deployment";

export type SignInSetupInput = {
  database: boolean;
  authSecret: boolean;
  email: boolean;
  google: boolean;
  logLinks: boolean;
  production: boolean;
  /** Where this is running, so the steps can name the Vercel environment to fix. */
  deployment?: Deployment | null;
  /** Database variables set under names the app doesn't read (a prefixed connection). */
  strayDatabaseVariables?: readonly string[];
};

/**
 * What an operator must still do before anyone can sign in, in order. Empty when sign-in works.
 * Variables only reach deployments made after they're set, hence the redeploy reminder.
 */
export function signInSetupSteps(s: SignInSetupInput): string[] {
  const steps: string[] = [];
  const stray = s.strayDatabaseVariables ?? [];
  const where = s.deployment ? environmentLabel(s.deployment) : null;
  if (!s.database && stray.length > 0) {
    steps.push(
      `Found ${stray.join(", ")} but no DATABASE_URL: the database was connected with a custom prefix. Reconnect it without a prefix (Vercel: Storage → your database → Projects), or add DATABASE_URL with the same value.`,
    );
  } else if (!s.database && where) {
    steps.push(
      `Add DATABASE_URL for the ${where} environment. In Vercel → Settings → Environment Variables it must be listed for ${where}; if it isn't, edit the Neon connection (Storage → your database → Projects) to include ${where}.`,
    );
  } else if (!s.database) {
    steps.push(
      "Add DATABASE_URL (Vercel: Storage → your Neon database → Connect Project, with Production and Preview ticked).",
    );
  }
  if (!s.authSecret) {
    steps.push(
      `Add AUTH_SECRET${where ? ` for the ${where} environment` : ""}, a random string of 32+ characters (generate one with \`npx auth secret\`).`,
    );
  }
  if (s.production && !s.email && !s.google && !s.logLinks) {
    steps.push(
      "Set up a way to deliver sign-in links: RESEND_API_KEY and EMAIL_FROM, or Google sign-in. To sign in before email is ready, set AUTH_LOG_SIGN_IN_LINKS=true and copy the link from the deployment's logs.",
    );
  }
  if (steps.length > 0 && s.production) {
    steps.push(
      "Redeploy: new environment variables only reach deployments made after they're added.",
    );
  }
  return steps;
}
