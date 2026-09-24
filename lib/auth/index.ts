import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import ResendProvider from "next-auth/providers/resend";
import { Resend } from "resend";
import { getDb, schema } from "@/lib/db";
import { env } from "@/lib/env/server";
import { isConfigured } from "@/lib/integrations";
import { magicLinkEmail } from "./magic-link-email";

export const MAGIC_LINK_PROVIDER_ID = "resend";

/** Sessions need a DB (database sessions) and a signing secret (AUTH_SECRET). */
export function isAuthReady(): boolean {
  return isConfigured("database") && isConfigured("auth");
}

/** Magic link also needs a way to deliver the link: Resend, or the console in dev. */
export function isMagicLinkAvailable(): boolean {
  return isAuthReady() && (isConfigured("email") || env.NODE_ENV !== "production");
}

export function isGoogleSignInAvailable(): boolean {
  return isAuthReady() && isConfigured("googleAuth");
}

function buildConfig(): NextAuthConfig {
  const providers: NextAuthConfig["providers"] = [];

  if (isMagicLinkAvailable()) {
    providers.push(
      ResendProvider({
        id: MAGIC_LINK_PROVIDER_ID,
        apiKey: env.RESEND_API_KEY,
        from: env.EMAIL_FROM,
        maxAge: 24 * 60 * 60,
        async sendVerificationRequest({ identifier, url }) {
          const { host } = new URL(url);
          if (!isConfigured("email")) {
            // Dev only (isMagicLinkAvailable guarantees we're not in production here).
            console.info(`\n🔑  Magic link for ${identifier}:\n    ${url}\n`);
            return;
          }
          const { subject, html, text } = magicLinkEmail({ url, host });
          const resend = new Resend(env.RESEND_API_KEY);
          const { error } = await resend.emails.send({
            from: env.EMAIL_FROM ?? "",
            to: identifier,
            subject,
            html,
            text,
          });
          if (error) throw new Error(`Resend failed to send the sign-in email: ${error.message}`);
        },
      }),
    );
  }

  if (isGoogleSignInAvailable()) {
    providers.push(Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }));
  }

  const db = isConfigured("database") ? getDb() : null;

  return {
    adapter: db
      ? DrizzleAdapter(db, {
          usersTable: schema.users,
          accountsTable: schema.accounts,
          sessionsTable: schema.sessions,
          verificationTokensTable: schema.verificationTokens,
        })
      : undefined,
    // Database sessions: revocable, and memberships/roles are looked up server-side anyway.
    session: { strategy: db ? "database" : "jwt" },
    providers,
    trustHost: true,
    secret: env.AUTH_SECRET,
    pages: {
      signIn: "/login",
      verifyRequest: "/login/check-email",
      error: "/login",
    },
    callbacks: {
      session({ session, user }) {
        if (user) session.user.id = user.id;
        return session;
      },
    },
  };
}

// Lazy config: nothing touches the DB until the first auth call, so builds and
// marketing pages work before Neon is connected.
const nextAuth = NextAuth(() => buildConfig());
export const { handlers, signIn, signOut } = nextAuth;

/**
 * The current staff session, or null. Returns null without calling Auth.js when sign-in
 * isn't configured, so an unconfigured deploy doesn't log MissingSecret on every request.
 */
export async function getSession() {
  if (!isAuthReady()) return null;
  return nextAuth.auth();
}
