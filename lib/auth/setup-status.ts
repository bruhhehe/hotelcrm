export type SignInSetupInput = {
  database: boolean;
  authSecret: boolean;
  email: boolean;
  google: boolean;
  logLinks: boolean;
  production: boolean;
};

/**
 * What an operator must still do before anyone can sign in, in order. Empty when sign-in works.
 * Variables only reach deployments made after they're set, hence the redeploy reminder.
 */
export function signInSetupSteps(s: SignInSetupInput): string[] {
  const steps: string[] = [];
  if (!s.database) {
    steps.push(
      "Add DATABASE_URL (Vercel: Storage → your Neon database → Connect Project, with Production and Preview ticked).",
    );
  }
  if (!s.authSecret) {
    steps.push(
      "Add AUTH_SECRET, a random string of 32+ characters (generate one with `npx auth secret`).",
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
