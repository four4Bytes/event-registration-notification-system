import type { OfficerPosition, Role } from "@/generated/prisma/browser";

export const roleLabels: Record<Role, string> = {
  STUDENT: "Student",
  OFFICER: "Officer",
  ADMIN: "Admin",
  DEV: "Dev",
};

export const officerPositionLabels: Record<OfficerPosition, string> = {
  PRESIDENT: "President",
};
