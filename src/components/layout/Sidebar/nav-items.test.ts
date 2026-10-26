import { describe, expect, it } from "vitest";

import { OfficerPosition, Role } from "@/generated/prisma/browser";

import { getVisibleNavItems } from "./nav-items";

function hrefs(role: Role, officerPosition: OfficerPosition | null = null): string[] {
  return getVisibleNavItems({ role, officerPosition }).map((item) => item.href);
}

const ADMIN_HREFS = [
  "/dashboard",
  "/admin/approvals",
  "/admin/events",
  "/admin/people",
  "/admin/tasks",
  "/admin/attendance",
  "/notifications",
  "/admin/audit-log",
];

const STUDENT_HREFS = ["/dashboard", "/events", "/registrations", "/attendance", "/notifications"];

describe("getVisibleNavItems", () => {
  it.each([
    ["Admin", Role.ADMIN],
    ["Dev", Role.DEV],
  ])("shows the Admin control-center nav to %s", (_label, role) => {
    expect(hrefs(role)).toEqual(ADMIN_HREFS);
  });

  it("hides student-only routes from Admins", () => {
    const visible = hrefs(Role.ADMIN);

    expect(visible).not.toContain("/events");
    expect(visible).not.toContain("/registrations");
    expect(visible).not.toContain("/attendance");
  });

  it.each([
    ["Student", Role.STUDENT, null],
    ["Officer", Role.OFFICER, null],
    ["President", Role.OFFICER, OfficerPosition.PRESIDENT],
  ])("keeps the student nav for %s", (_label, role, position) => {
    expect(hrefs(role, position)).toEqual(STUDENT_HREFS);
  });

  it.each([
    ["Student", Role.STUDENT, null],
    ["Officer", Role.OFFICER, null],
    ["President", Role.OFFICER, OfficerPosition.PRESIDENT],
  ])("hides Admin routes from %s", (_label, role, position) => {
    const visible = hrefs(role, position);

    expect(visible.some((href) => href.startsWith("/admin/"))).toBe(false);
  });
});
