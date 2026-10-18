"use server";

import { writeAuditLog } from "@/features/audit/write-audit-log";
import { EventStatus } from "@/generated/prisma/browser";
import {
  actionConflict,
  actionInvalid,
  actionNotFound,
  type ActionStatusResponse,
} from "@/lib/security/action-response";
import { requireAuth, requirePermission } from "@/lib/security/auth-guards";
import { toActionResponse } from "@/lib/security/errors";

import { canTransition } from "./lifecycle";
import { updateEventStatus } from "./mutations";
import { getEvents, getEventStatus, type EventListRow } from "./queries";
import { EventIdSchema } from "./schemas";

export async function getEventsAction(): Promise<EventListRow[]> {
  const session = await requireAuth();
  return getEvents(session.role);
}

export async function publishEventAction(payload: unknown): Promise<ActionStatusResponse> {
  try {
    await requirePermission("publishEvent");
    const parsed = EventIdSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event");
    const { eventId } = parsed.data;

    const status = await getEventStatus(eventId);
    if (!status) return actionNotFound("Event");
    if (!canTransition(status, EventStatus.PUBLISHED)) {
      return actionConflict(
        "Cannot publish this event",
        `An event in ${status} cannot be published.`,
      );
    }

    await updateEventStatus(eventId, EventStatus.PUBLISHED);
    await writeAuditLog({
      entityType: "Event",
      entityId: eventId,
      action: "PUBLISH",
      previousState: { status },
      newState: { status: EventStatus.PUBLISHED },
    });

    return { success: true };
  } catch (error) {
    return toActionResponse(error, "publish event");
  }
}
