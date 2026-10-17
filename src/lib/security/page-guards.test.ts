import { describe, expect, it } from "vitest";

import { Role } from "@/generated/prisma/browser";
import { requirePagePermission } from "@/lib/security/page-guards";

/** Next signals a redirect by throwing; the destination lands in `error.digest`. */
function redirectTarget(run: () => void): string {
  try {
    run();
  } catch (error) {
    if (error instanceof Error && "digest" in error) return String(error.digest);
    throw error;
  }
  return "";
}

describe("requirePagePermission", () => {
  it("lets a role that holds the permission through", () => {
    expect(() => requirePagePermission({ role: Role.ADMIN }, "manageUsers")).not.toThrow();
    expect(() => requirePagePermission({ role: Role.DEV }, "manageUsers")).not.toThrow();
    expect(() => requirePagePermission({ role: Role.OFFICER }, "markAttendance")).not.toThrow();
  });

  it("redirects a refused role to the access-denied page rather than failing the page", () => {
    expect(
      redirectTarget(() => requirePagePermission({ role: Role.STUDENT }, "manageUsers")),
    ).toContain("/auth/error?error=Forbidden");
    expect(
      redirectTarget(() => requirePagePermission({ role: Role.OFFICER }, "manageUsers")),
    ).toContain("/auth/error?error=Forbidden");
    expect(
      redirectTarget(() => requirePagePermission({ role: Role.APPROVER }, "manageUsers")),
    ).toContain("/auth/error?error=Forbidden");
  });
});
