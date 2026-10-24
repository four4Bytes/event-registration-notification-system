import type { Notification, NotificationAudience } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

export interface NotificationCreatePayload {
  title: string;
  body: string;
  audience: NotificationAudience;
  clubId: string | null;
  createdById: string;
}

export async function createNotification(
  payload: NotificationCreatePayload,
): Promise<Notification> {
  return prisma.notification.create({ data: payload });
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  await prisma.notificationRead.upsert({
    where: { notificationId_userId: { notificationId, userId } },
    update: { readAt: new Date() },
    create: { notificationId, userId },
  });
}
