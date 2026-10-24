import type { Event } from "@/generated/prisma/client";
import { prisma } from "@/lib/infra/prisma";

export type EventRow = Pick<
  Event,
  "id" | "title" | "description" | "venue" | "startAt" | "endAt"
> & {
  clubName: string | null;
  organizer: string;
};

export async function getEventById(eventId: string): Promise<EventRow | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      description: true,
      venue: true,
      startAt: true,
      endAt: true,
      club: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!event) return null;

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    venue: event.venue,
    startAt: event.startAt,
    endAt: event.endAt,
    clubName: event.club?.name ?? null,
    organizer: event.club?.name ?? event.createdBy.name,
  };
}
