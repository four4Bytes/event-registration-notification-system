import { getEnvBoolean } from "@/lib/infra/env";

/**
 * Whether the development-only sign-in is available.
 *
 * Enabled only when `AUTH_DEV_LOGIN` is truthy and the build is not a
 * production build, so it cannot be turned on in production by configuration
 * alone. See ADR-0008.
 */
export function isDevLoginEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && getEnvBoolean("AUTH_DEV_LOGIN");
}
