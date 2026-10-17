import { Role } from "@/generated/prisma/browser";

export const ASSIGNABLE_ROLES = [Role.STUDENT, Role.OFFICER, Role.ADMIN, Role.APPROVER] as const;

export const roleLabels: Record<Role, string> = {
  STUDENT: "Student",
  OFFICER: "Officer",
  ADMIN: "Admin",
  DEV: "Dev",
  APPROVER: "Approver",
};
