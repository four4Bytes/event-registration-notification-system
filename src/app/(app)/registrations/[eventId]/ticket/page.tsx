import { EventTicket } from "@/features/events/components/EventTicket/EventTicket";
import { auth } from "@/lib/infra/auth";

interface TicketPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { eventId } = await params;
  const session = await auth();

  return (
    <EventTicket
      eventId={eventId}
      attendeeName={session?.user?.name ?? "Student"}
      attendeeEmail={session?.user?.email ?? ""}
    />
  );
}
