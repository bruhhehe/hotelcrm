import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for the staff app: redirect to /login when there is no session cookie at
 * all. This runs on the edge without a DB hit; the (app) layout does the real session check
 * via `requireUser()`, so a forged/expired cookie still ends up at /login.
 */
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function middleware(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calendar/:path*",
    "/availability/:path*",
    "/reservations/:path*",
    "/housekeeping/:path*",
    "/guests/:path*",
    "/data/:path*",
    "/settings/:path*",
    "/whats-new/:path*",
  ],
};
