import type { Role } from "@/generated/prisma/browser";
import { notificationVisibility } from "@/lib/security/rbac";

export interface NotificationScope {
  userId: string;
  clubId: string | null;
  viewAll: boolean;
}

export interface NotificationScopeUser {
  id: string;
  role: Role;
  clubId: string | null;
}

export function buildNotificationScope(user: NotificationScopeUser): NotificationScope {
  return {
    userId: user.id,
    clubId: user.clubId,
    viewAll: notificationVisibility(user.role) === "global",
  };
}
