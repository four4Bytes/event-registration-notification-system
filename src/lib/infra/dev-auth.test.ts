import { afterEach, describe, expect, it, vi } from "vitest";

import { isDevLoginEnabled } from "@/lib/infra/dev-auth";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isDevLoginEnabled", () => {
  it("is enabled when the flag is set in a development build", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_DEV_LOGIN", "true");
    expect(isDevLoginEnabled()).toBe(true);
  });

  it("is disabled when the flag is set in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_DEV_LOGIN", "true");
    expect(isDevLoginEnabled()).toBe(false);
  });

  it("is disabled when the flag is off in a development build", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_DEV_LOGIN", "false");
    expect(isDevLoginEnabled()).toBe(false);
  });

  it("is disabled when the flag is off in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_DEV_LOGIN", "false");
    expect(isDevLoginEnabled()).toBe(false);
  });

  it("is disabled when neither value is set", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_DEV_LOGIN", "");
    expect(isDevLoginEnabled()).toBe(false);
  });
});
