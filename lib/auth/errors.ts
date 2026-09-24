/** Friendly copy for the `?error=` codes Auth.js redirects to /login with. */
export function authErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "Verification":
      return "That sign-in link has expired or was already used. Request a new one below.";
    case "OAuthAccountNotLinked":
      return "This email is already linked to another sign-in method. Use the method you signed up with.";
    case "AccessDenied":
      return "You don't have access to Lodgely with that account.";
    case "Configuration":
      return "Sign-in isn't configured correctly on this server. Please contact support.";
    default:
      return "We couldn't sign you in. Please try again.";
  }
}
