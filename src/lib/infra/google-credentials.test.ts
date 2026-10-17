import { afterEach, describe, expect, it } from "vitest";

import { getGoogleCredentials } from "@/lib/infra/google-credentials";

const original = {
  clientId: process.env.AUTH_GOOGLE_ID,
  clientSecret: process.env.AUTH_GOOGLE_SECRET,
};

function setCredentials(clientId?: string, clientSecret?: string): void {
  if (clientId === undefined) delete process.env.AUTH_GOOGLE_ID;
  else process.env.AUTH_GOOGLE_ID = clientId;
  if (clientSecret === undefined) delete process.env.AUTH_GOOGLE_SECRET;
  else process.env.AUTH_GOOGLE_SECRET = clientSecret;
}

afterEach(() => {
  setCredentials(original.clientId, original.clientSecret);
});

describe("getGoogleCredentials", () => {
  it("reads both credentials and reports them configured", () => {
    setCredentials("id-value", "secret-value");
    expect(getGoogleCredentials(false)).toEqual({
      clientId: "id-value",
      clientSecret: "secret-value",
      isConfigured: true,
    });
  });

  it("still reads both credentials when the development sign-in is enabled", () => {
    setCredentials("id-value", "secret-value");
    expect(getGoogleCredentials(true).isConfigured).toBe(true);
  });

  it("fails loudly when only the id is set and the development sign-in is off", () => {
    setCredentials("id-value", undefined);
    expect(() => getGoogleCredentials(false)).toThrow(/AUTH_GOOGLE_SECRET/);
  });

  it("fails loudly when only the secret is set and the development sign-in is off", () => {
    setCredentials(undefined, "secret-value");
    expect(() => getGoogleCredentials(false)).toThrow(/AUTH_GOOGLE_ID/);
  });

  it("fails loudly when neither is set and the development sign-in is off", () => {
    setCredentials(undefined, undefined);
    expect(() => getGoogleCredentials(false)).toThrow(/AUTH_GOOGLE_ID/);
  });

  it("tolerates an incomplete pair when the development sign-in is on", () => {
    setCredentials("id-value", undefined);
    expect(getGoogleCredentials(true)).toEqual({
      clientId: "id-value",
      clientSecret: "",
      isConfigured: false,
    });

    setCredentials(undefined, "secret-value");
    expect(getGoogleCredentials(true).isConfigured).toBe(false);

    setCredentials(undefined, undefined);
    expect(getGoogleCredentials(true)).toEqual({
      clientId: "",
      clientSecret: "",
      isConfigured: false,
    });
  });

  it("treats empty strings as missing", () => {
    setCredentials("", "");
    expect(() => getGoogleCredentials(false)).toThrow(/AUTH_GOOGLE_ID/);
  });
});
