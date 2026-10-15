import type { Role } from "@/generated/prisma/browser";

export const roleLabels: Record<Role, string> = {
  STUDENT: "Student",
  OFFICER: "Officer",
  ADMIN: "Admin",
  DEV: "Dev",
  ATTENDANCE_STAFF: "Attendance Staff",
  APPROVER: "Approver",
};
