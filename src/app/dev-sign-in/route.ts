import { NextResponse } from "next/server";

import { getAuthAdapterClient } from "@/features/users/mutations";
import { isDevLoginEnabled } from "@/lib/infra/dev-auth";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/infra/session";

/** Cookie name Auth.js uses for database sessions over http (@auth/core `defaultCookies`). */
const SESSION_COOKIE = "authjs.session-token";

/**
 * Development-only sign-in: creates a real database session for an existing,
 * active user.
 *
 * Auth.js cannot do this through its Credentials provider, which always issues
 * a JWT cookie, while this app uses database sessions. Refuses with 404 unless
 * {@link isDevLoginEnabled} (see ADR-0008).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!isDevLoginEnabled()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const email = url.searchParams.get("email")?.toLowerCase();
  const user = email ? await getAuthAdapterClient().user.findUnique({ where: { email } }) : null;
  if (!user || !user.isActive) {
    return NextResponse.redirect(new URL("/auth/error?error=DevLoginUser", url));
  }

  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await getAuthAdapterClient().session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  const response = NextResponse.redirect(new URL("/notifications", url));
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
  return response;
}
