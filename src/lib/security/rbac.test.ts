import { describe, expect, it } from "vitest";

import { OfficerPosition, Role } from "@/generated/prisma/browser";
import {
  can,
  canWithPosition,
  PERMISSION_MATRIX,
  positionAllows,
  type AccessLevel,
  type Permission,
} from "@/lib/security/rbac";

type ExpectedRow = Record<Role, AccessLevel>;

const EXPECTED_MATRIX: Record<Permission, ExpectedRow> = {
  "user.read": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "user.create": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "user.update": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "user.delete": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "club.read": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "club.create": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "club.update": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "club.delete": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "notification.read": { DEV: "yes", ADMIN: "yes", OFFICER: "own_club", STUDENT: "own_club" },
  "notification.create": { DEV: "yes", ADMIN: "yes", OFFICER: "own_club", STUDENT: "no" },
  "officer.assign_president": { DEV: "yes", ADMIN: "yes", OFFICER: "no", STUDENT: "no" },
  "task.assign": { DEV: "yes", ADMIN: "yes", OFFICER: "own_club", STUDENT: "no" },
  "task.read_club": { DEV: "yes", ADMIN: "yes", OFFICER: "own_club", STUDENT: "no" },
  "task.read_own": { DEV: "yes", ADMIN: "no", OFFICER: "yes", STUDENT: "no" },
  "task.update_own": { DEV: "yes", ADMIN: "no", OFFICER: "yes", STUDENT: "no" },
  "attendance.scan": { DEV: "yes", ADMIN: "no", OFFICER: "own_club", STUDENT: "no" },
  "attendance.view_results": { DEV: "yes", ADMIN: "yes", OFFICER: "own_club", STUDENT: "no" },
};

const MATRIX_CASES = Object.entries(EXPECTED_MATRIX).flatMap(([permission, row]) =>
  Object.entries(row).map(([role, level]) => [permission, role, level] as const),
);

describe("PERMISSION_MATRIX", () => {
  it.each(MATRIX_CASES)("grants %s to %s as %s", (permission, role, level) => {
    expect(PERMISSION_MATRIX[permission as Permission][role as Role]).toBe(level);
  });

  it("covers every permission with every role", () => {
    for (const row of Object.values(PERMISSION_MATRIX)) {
      expect(Object.keys(row).sort()).toEqual(Object.values(Role).sort());
    }
  });
});

describe("can", () => {
  it("denies a missing role", () => {
    expect(can(null, "task.read_own")).toBe(false);
  });

  it("treats own_club as granted", () => {
    expect(can(Role.OFFICER, "task.read_club")).toBe(true);
  });

  it("denies a capability the role lacks", () => {
    expect(can(Role.STUDENT, "task.read_own")).toBe(false);
  });
});

describe("positionAllows", () => {
  it.each([
    ["task.read_own", true],
    ["task.update_own", true],
    ["attendance.scan", true],
    ["notification.create", false],
    ["task.assign", false],
    ["task.read_club", false],
    ["attendance.view_results", false],
  ] as const)("plain officer %s => %s", (permission, expected) => {
    expect(positionAllows(null, permission)).toBe(expected);
  });

  it.each([
    ["task.read_own", true],
    ["task.update_own", true],
    ["attendance.scan", true],
    ["notification.create", true],
    ["task.assign", true],
    ["task.read_club", true],
    ["attendance.view_results", true],
    ["officer.assign_president", false],
    ["user.read", false],
  ] as const)("president %s => %s", (permission, expected) => {
    expect(positionAllows(OfficerPosition.PRESIDENT, permission)).toBe(expected);
  });
});

describe("canWithPosition", () => {
  it("denies notification composing to a plain officer", () => {
    expect(canWithPosition(Role.OFFICER, null, "notification.create")).toBe(false);
  });

  it("allows notification composing to a president", () => {
    expect(canWithPosition(Role.OFFICER, OfficerPosition.PRESIDENT, "notification.create")).toBe(
      true,
    );
  });

  it("ignores position for admins", () => {
    expect(canWithPosition(Role.ADMIN, null, "officer.assign_president")).toBe(true);
  });

  it("denies club-wide tasks to a plain officer", () => {
    expect(canWithPosition(Role.OFFICER, null, "task.read_club")).toBe(false);
  });

  it("denies scanning to an admin regardless of position", () => {
    expect(canWithPosition(Role.ADMIN, null, "attendance.scan")).toBe(false);
  });
});
