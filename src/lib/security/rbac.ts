import { Role } from "@/generated/prisma/browser";

export type Permission = "manageUsers" | "sendNotifications" | "markAttendance";

export function can(role: Role, permission: Permission): boolean {
  if (permission === "manageUsers") return role === Role.ADMIN || role === Role.DEV;
  if (permission === "markAttendance") return role === Role.OFFICER || role === Role.ADMIN;
  return role === Role.OFFICER || role === Role.ADMIN || role === Role.DEV;
}
