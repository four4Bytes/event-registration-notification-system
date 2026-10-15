import { describe, expect, it } from "vitest";

import { Role } from "@/generated/prisma/browser";
import { can, type Permission } from "@/lib/security/rbac";

const matrix: Array<{ role: Role; permission: Permission; expected: boolean }> = [
  { role: Role.STUDENT, permission: "manageUsers", expected: false },
  { role: Role.OFFICER, permission: "manageUsers", expected: false },
  { role: Role.ADMIN, permission: "manageUsers", expected: true },
  { role: Role.DEV, permission: "manageUsers", expected: true },
  { role: Role.ATTENDANCE_STAFF, permission: "manageUsers", expected: false },
  { role: Role.APPROVER, permission: "manageUsers", expected: false },
  { role: Role.STUDENT, permission: "sendNotifications", expected: false },
  { role: Role.OFFICER, permission: "sendNotifications", expected: true },
  { role: Role.ADMIN, permission: "sendNotifications", expected: true },
  { role: Role.DEV, permission: "sendNotifications", expected: true },
  { role: Role.ATTENDANCE_STAFF, permission: "sendNotifications", expected: false },
  { role: Role.APPROVER, permission: "sendNotifications", expected: false },
  { role: Role.STUDENT, permission: "markAttendance", expected: false },
  { role: Role.OFFICER, permission: "markAttendance", expected: false },
  { role: Role.ADMIN, permission: "markAttendance", expected: true },
  { role: Role.DEV, permission: "markAttendance", expected: false },
  { role: Role.ATTENDANCE_STAFF, permission: "markAttendance", expected: true },
  { role: Role.APPROVER, permission: "markAttendance", expected: false },
];

describe("can", () => {
  it.each(matrix)("$role $permission → $expected", ({ role, permission, expected }) => {
    expect(can(role, permission)).toBe(expected);
  });
});
