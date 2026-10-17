/**
 * Google OAuth credential resolution.
 *
 * Google is the production sign-in provider, so a half-configured pair must
 * fail loudly at boot rather than leave the application running with no usable
 * provider. The development-only sign-in (ADR-0008) is the one configuration
 * that legitimately runs without Google credentials.
 *
 * @module lib/infra/google-credentials
 */

import { getOptionalEnvVar, getRequiredEnvVar } from "@/lib/infra/env";

export interface GoogleCredentials {
  clientId: string;
  clientSecret: string;
  /** Only true when both values are present, i.e. Google sign-in can be offered. */
  isConfigured: boolean;
}

/**
 * Reads the Google credentials, throwing when they are incomplete.
 *
 * @param devLoginEnabled - Whether the development-only sign-in is available
 * (`isDevLoginEnabled`). When it is, missing credentials are tolerated and the
 * caller simply registers no Google provider.
 * @returns The credential pair and whether it is complete.
 */
export function getGoogleCredentials(devLoginEnabled: boolean): GoogleCredentials {
  const clientId = getOptionalEnvVar("AUTH_GOOGLE_ID", "");
  const clientSecret = getOptionalEnvVar("AUTH_GOOGLE_SECRET", "");
  const isConfigured = Boolean(clientId && clientSecret);

  if (!isConfigured && !devLoginEnabled) {
    if (!clientId) getRequiredEnvVar("AUTH_GOOGLE_ID");
    getRequiredEnvVar("AUTH_GOOGLE_SECRET");
  }

  return { clientId, clientSecret, isConfigured };
}
