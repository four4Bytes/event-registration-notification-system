import { EventDetailView } from "@/features/events/components/EventDetailView/EventDetailView";
import { initialEvents } from "@/features/events/initial-events";
import { getEventById } from "@/features/events/queries";
import type { EventDetailData } from "@/features/events/types";

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const dbEvent = await getEventById(eventId);

  if (!dbEvent) {
    return <EventDetailView eventId={eventId} />;
  }

  const displayEvent: EventDetailData = {
    title: dbEvent.title,
    organizer: dbEvent.organizer,
    description: dbEvent.description ?? "",
    venue: dbEvent.venue,
    startAt: dbEvent.startAt.toISOString(),
    endAt: (dbEvent.endAt ?? dbEvent.startAt).toISOString(),
    host: dbEvent.clubName ? "club" : "organization",
  };

  // shortcut: seat data is shared by title until events store capacity/registration in the DB.
  const matchingEvent = initialEvents.find((event) => event.title === dbEvent.title);

  return <EventDetailView eventId={matchingEvent?.id ?? eventId} displayEvent={displayEvent} />;
}
