import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Optimistic check only (cookie present?), so unauthenticated visitors land on /sign-in quickly.
// Real authorization happens in every route handler via withSession.
// The one exception is the root: signed-out visitors get the landing page, rewritten so the URL stays "/".
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    if (request.nextUrl.pathname === "/") {
      return NextResponse.rewrite(new URL("/welcome", request.url));
    }
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except API routes, the sign-in page, link preview images (crawlers are signed out),
  // Next internals and files with an extension.
  matcher: [
    "/((?!api|sign-in|.*opengraph-image|_next/static|_next/image|.*\\..*).*)",
  ],
};
