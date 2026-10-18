import { EventStatus, Role } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

export interface EventListRow {
  id: string;
  title: string;
  venue: string;
  startAt: Date;
  status: EventStatus;
}

export async function getEvents(viewerRole: Role): Promise<EventListRow[]> {
  return prisma.event.findMany({
    where: viewerRole === Role.STUDENT ? { status: EventStatus.PUBLISHED } : undefined,
    select: { id: true, title: true, venue: true, startAt: true, status: true },
    orderBy: { startAt: "asc" },
  });
}

export async function getEventStatus(eventId: string): Promise<EventStatus | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { status: true },
  });
  return event?.status ?? null;
}
