import { EventsBrowser } from "@/features/events/components/EventsBrowser/EventsBrowser";

interface EventsPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { status } = await searchParams;

  return <EventsBrowser initialStatus={status === "open" ? "open" : "all"} />;
}
