import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Optimistic check only (cookie present?), so unauthenticated visitors land on /sign-in quickly.
// Real authorization happens in every route handler via withSession.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except API routes, the sign-in page, Next internals and files with an extension.
  matcher: ["/((?!api|sign-in|_next/static|_next/image|.*\\..*).*)"],
};
