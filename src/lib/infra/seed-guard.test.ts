import { describe, expect, it } from "vitest";

import { assertSeedAllowed } from "@/lib/infra/seed-guard";

const LOCAL_URL = "postgresql://postgres:postgres@localhost:5433/kasama?schema=public";
const REMOTE_URL = "postgresql://postgres:secret@db.prod.example.com:5432/kasama?schema=public";

describe("assertSeedAllowed", () => {
  it("refuses to seed when NODE_ENV is production", () => {
    expect(() => assertSeedAllowed({ nodeEnv: "production", databaseUrl: LOCAL_URL })).toThrow(
      /production/i,
    );
  });

  it("still refuses in production when ALLOW_SEED is set", () => {
    expect(() =>
      assertSeedAllowed({ nodeEnv: "production", databaseUrl: REMOTE_URL, allowSeed: true }),
    ).toThrow(/production/i);
  });

  it("refuses a non-local database host", () => {
    expect(() => assertSeedAllowed({ nodeEnv: "development", databaseUrl: REMOTE_URL })).toThrow(
      /non-local/i,
    );
  });

  it("names the offending host but not the password", () => {
    expect(() => assertSeedAllowed({ nodeEnv: "development", databaseUrl: REMOTE_URL })).toThrow(
      /db\.prod\.example\.com/,
    );
    expect(() =>
      assertSeedAllowed({ nodeEnv: "development", databaseUrl: REMOTE_URL }),
    ).not.toThrow(/secret/);
  });

  it("allows a non-local host when ALLOW_SEED is set explicitly", () => {
    expect(() =>
      assertSeedAllowed({ nodeEnv: "development", databaseUrl: REMOTE_URL, allowSeed: true }),
    ).not.toThrow();
  });

  it("allows a local database host", () => {
    expect(() =>
      assertSeedAllowed({ nodeEnv: "development", databaseUrl: LOCAL_URL }),
    ).not.toThrow();
  });

  it("refuses when DATABASE_URL is not set", () => {
    expect(() => assertSeedAllowed({ nodeEnv: "development", databaseUrl: "" })).toThrow(
      /DATABASE_URL is not set/i,
    );
  });

  it("refuses a connection string it cannot parse, without echoing it", () => {
    expect(() =>
      assertSeedAllowed({ nodeEnv: "development", databaseUrl: "not-a-url-with-secret" }),
    ).toThrow(/invalid/i);
    expect(() =>
      assertSeedAllowed({ nodeEnv: "development", databaseUrl: "not-a-url-with-secret" }),
    ).not.toThrow(/secret/);
  });
});
