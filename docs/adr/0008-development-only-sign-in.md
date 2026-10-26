# Development-only sign-in

Context: the only provider is Google OAuth (`src/lib/infra/auth.ts`), which
needs `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, and sessions use the `database`
strategy. On a machine without Google credentials no one can sign in, so no
role-based screen can be demonstrated.

The obvious mechanism — a `Credentials` provider — does not work here.
`@auth/core` always issues a signed **JWT** cookie for the Credentials branch
(`lib/actions/callback/index.js`, credentials branch) and never calls
`adapter.createSession`, while this app resolves sessions through the database
(`handle-login.js`: `getSessionAndUser(sessionToken)`). A Credentials login
would report success and leave the browser signed out.

Decision: a development-only route, `GET /dev-sign-in?email=<seeded email>`,
mints a real `Session` row and sets the `authjs.session-token` cookie — the
same session record Auth.js itself creates. It is available only when
`AUTH_DEV_LOGIN` is truthy **and** `NODE_ENV !== "production"`
(`src/lib/infra/dev-auth.ts`); otherwise it returns 404. The sign-in page lists
the seeded users as links, rendered only when the same helper is true.

Consequences:

- The dev sign-in bypasses the domain gate and the `signIn` callback by design.
  It creates a session for any existing, active user; it refuses inactive users.
- It is not an authentication mechanism: it grants a session without proving
  identity, so it must never run in production. Both the flag and the
  production check must pass, and `AUTH_DEV_LOGIN` is not set by default.
- It writes no audit entry (no decision is being made) and does not weaken any
  existing guard: `requireAuth`/`requirePermission` and the suspended/inactive
  refusal still apply to every operation behind it.
- Delete the route, the helper and the seed once real Google credentials are
  configured.

Rejected alternatives: a Credentials provider (incompatible with database
sessions, above); switching the whole app to JWT sessions (changes production
auth behaviour to support a development convenience); editing the `Session`
table by hand (same effect, more error-prone, unauditable).
