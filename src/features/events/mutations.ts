import type { EventStatus } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

export async function updateEventStatus(eventId: string, status: EventStatus) {
  return prisma.event.update({ where: { id: eventId }, data: { status } });
}
