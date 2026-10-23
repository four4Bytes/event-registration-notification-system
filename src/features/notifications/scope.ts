import { NotificationAudience, type Role } from "@/generated/prisma/browser";
import type { Prisma } from "@/generated/prisma/client";
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

/**
 * Builds the Prisma audience filter for notifications visible to a scope.
 *
 * @param scope - The caller's notification scope.
 * @returns A where-input matching every notification the scope may see.
 */
export function buildNotificationAudienceFilter(
  scope: NotificationScope,
): Prisma.NotificationWhereInput {
  if (scope.viewAll) return {};
  return {
    OR: [
      { audience: NotificationAudience.ALL },
      ...(scope.clubId ? [{ audience: NotificationAudience.CLUB, clubId: scope.clubId }] : []),
    ],
  };
}
