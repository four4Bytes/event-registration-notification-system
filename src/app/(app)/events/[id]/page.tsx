import { notFound } from "next/navigation";

import { EventDetailView } from "@/features/events/components/EventDetailView/EventDetailView";
import { buildEventLink, generateEventQrDataUrl } from "@/features/events/qr";
import { getEventById } from "@/features/events/queries";
import { buildEventScope, canManageEvent, canViewEvent } from "@/features/events/scope";
import { requirePagePermission } from "@/lib/security/auth-guards";
import { can, eventVisibility } from "@/lib/security/rbac";

const CUID_PATTERN = /^c[a-z0-9]{24}$/;

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePagePermission("event.read");
  if (!CUID_PATTERN.test(id)) notFound();

  const event = await getEventById(id);
  if (!event) notFound();

  const scope = buildEventScope(session);
  if (!canViewEvent(scope, event)) notFound();

  const link = buildEventLink(event.publicToken);
  const dataUrl = await generateEventQrDataUrl(link);

  return (
    <EventDetailView
      event={event}
      qr={{ link, dataUrl }}
      canManage={canManageEvent(scope, event)}
      canDelete={can(session.role, "event.delete")}
      isAdmin={eventVisibility(session.role) === "global"}
    />
  );
}
