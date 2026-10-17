/**
 * Safety guard for the demo seed (`prisma/seed.ts`).
 *
 * The seed writes demo users, and would overwrite the role, active status and
 * club of any real account sharing an email address. `assertSeedAllowed`
 * refuses the dangerous configurations before the script connects.
 *
 * @module lib/infra/seed-guard
 */

/** Hostnames the seed may write to without an explicit override. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export interface SeedEnvironment {
  /** `process.env.NODE_ENV`. */
  nodeEnv: string | undefined;
  /** `process.env.DATABASE_URL`. */
  databaseUrl: string;
  /** `ALLOW_SEED=true` permits a non-local database. Never overrides production. */
  allowSeed?: boolean;
}

/**
 * Throws unless seeding is safe with this configuration.
 *
 * Production always refuses, even with `ALLOW_SEED`, because the seed writes
 * demo data rather than real data. Any other environment needs `ALLOW_SEED`
 * when the database host is not local. Error messages name the host and never
 * echo the connection string, which carries the password.
 *
 * @param environment - The values to judge, passed in so the guard is pure.
 */
export function assertSeedAllowed({
  nodeEnv,
  databaseUrl,
  allowSeed = false,
}: SeedEnvironment): void {
  if (nodeEnv === "production") {
    throw new Error(
      "Refusing to seed: NODE_ENV is production. The seed writes demo data; never run it against a production database.",
    );
  }

  if (!databaseUrl.trim()) {
    throw new Error("Refusing to seed: DATABASE_URL is not set.");
  }

  let hostname: string;
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    throw new Error("Refusing to seed: DATABASE_URL is invalid (no host could be determined).");
  }

  if (!LOCAL_HOSTS.has(hostname) && !allowSeed) {
    throw new Error(
      `Refusing to seed: DATABASE_URL points at the non-local host "${hostname}". Set ALLOW_SEED=true to seed it deliberately.`,
    );
  }
}
