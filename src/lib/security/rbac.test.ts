import { describe, expect, it } from "vitest";

import { Role } from "@/generated/prisma/browser";
import { can, PERMISSIONS, type Permission } from "@/lib/security/rbac";

const roles = Object.values(Role);

const matrix: Array<{ role: Role; permission: Permission; expected: boolean }> = [
  { role: Role.STUDENT, permission: "manageUsers", expected: false },
  { role: Role.OFFICER, permission: "manageUsers", expected: false },
  { role: Role.ADMIN, permission: "manageUsers", expected: true },
  { role: Role.DEV, permission: "manageUsers", expected: true },
  { role: Role.APPROVER, permission: "manageUsers", expected: false },
  { role: Role.STUDENT, permission: "sendNotifications", expected: false },
  { role: Role.OFFICER, permission: "sendNotifications", expected: true },
  { role: Role.ADMIN, permission: "sendNotifications", expected: true },
  { role: Role.DEV, permission: "sendNotifications", expected: true },
  { role: Role.APPROVER, permission: "sendNotifications", expected: false },
  { role: Role.STUDENT, permission: "markAttendance", expected: false },
  { role: Role.OFFICER, permission: "markAttendance", expected: true },
  { role: Role.ADMIN, permission: "markAttendance", expected: true },
  { role: Role.DEV, permission: "markAttendance", expected: false },
  { role: Role.APPROVER, permission: "markAttendance", expected: false },
];

describe("can", () => {
  it.each(matrix)("$role $permission → $expected", ({ role, permission, expected }) => {
    expect(can(role, permission)).toBe(expected);
  });

  it("covers every role against every permission, denied cases included", () => {
    const covered = new Set(matrix.map(({ role, permission }) => `${role}:${permission}`));
    for (const role of roles) {
      for (const permission of PERMISSIONS) {
        expect(covered.has(`${role}:${permission}`)).toBe(true);
      }
    }
    expect(matrix).toHaveLength(roles.length * PERMISSIONS.length);

    for (const permission of PERMISSIONS) {
      const denied = matrix.filter((row) => row.permission === permission && !row.expected);
      expect(denied.length).toBeGreaterThan(0);
    }
  });
});
