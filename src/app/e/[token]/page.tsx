import { notFound } from "next/navigation";

import { EventDetailView } from "@/features/events/components/EventDetailView/EventDetailView";
import { getEventByPublicToken } from "@/features/events/queries";
import { EventTokenSchema } from "@/features/events/schemas";
import { buildEventScope, canViewEvent } from "@/features/events/scope";
import { requirePagePermissionWithCallback } from "@/lib/security/auth-guards";

export default async function ScannedEventPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await requirePagePermissionWithCallback(`/e/${token}`, "event.read");

  const parsed = EventTokenSchema.safeParse(token);
  if (!parsed.success) notFound();

  const event = await getEventByPublicToken(parsed.data);
  if (!event) notFound();

  const scope = buildEventScope(session);
  if (!canViewEvent(scope, event)) notFound();

  return (
    <EventDetailView event={event} qr={null} canManage={false} canDelete={false} isAdmin={false} />
  );
}
