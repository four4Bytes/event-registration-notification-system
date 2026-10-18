import { getEventsAction } from "@/features/events/actions";
import { EventsList } from "@/features/events/components/EventsList/EventsList";
import { requireAuth } from "@/lib/security/auth-guards";
import { can } from "@/lib/security/rbac";

export default async function EventsPage() {
  const user = await requireAuth();
  const rows = await getEventsAction();

  return <EventsList initialRows={rows} canPublish={can(user.role, "publishEvent")} />;
}
