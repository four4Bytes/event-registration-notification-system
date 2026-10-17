import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/dev-sign-in/route";

const signInUrl = "http://localhost:3001/dev-sign-in?email=student@acdeducation.com";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /dev-sign-in", () => {
  it("returns 404 in a production build even with the flag set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_DEV_LOGIN", "true");

    const response = await GET(new Request(signInUrl));

    expect(response.status).toBe(404);
  });

  it("returns 404 when the flag is off", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_DEV_LOGIN", "false");

    const response = await GET(new Request(signInUrl));

    expect(response.status).toBe(404);
  });
});
