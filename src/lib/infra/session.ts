/**
 * Session lifetime.
 *
 * Shared by the Auth.js configuration and the development-only sign-in route
 * (ADR-0008) so the two cannot drift apart.
 *
 * @module lib/infra/session
 */

/** Thirty days, the Auth.js default this application previously relied on implicitly. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
