import { EventsManagement } from "@/features/events/components/EventsManagement/EventsManagement";
import { getEventPage } from "@/features/events/queries";
import { buildEventScope } from "@/features/events/scope";
import { requirePagePermission } from "@/lib/security/auth-guards";
import { can, eventVisibility } from "@/lib/security/rbac";

export default async function EventsPage() {
  const session = await requirePagePermission("event.read");
  const page = await getEventPage({
    scope: buildEventScope(session),
    query: { pageSize: 10 },
  });

  return (
    <EventsManagement
      initialRows={page.rows}
      initialCursor={page.nextCursor}
      canCreate={can(session.role, "event.create")}
      isAdmin={eventVisibility(session.role) === "global"}
    />
  );
}
