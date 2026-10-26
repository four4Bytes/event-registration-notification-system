"use server";

import type { PageQuery } from "@/lib/primitives/types";
import {
  actionConflict,
  actionForbidden,
  actionInvalid,
  actionNotFound,
  type ActionStatusResponse,
} from "@/lib/security/action-response";
import { requirePermission } from "@/lib/security/auth-guards";
import { toActionResponse } from "@/lib/security/errors";

import { createEvent, deleteEvent, updateEvent } from "./mutations";
import { getEventById, getEventPage, type EventPage } from "./queries";
import {
  CreateEventSchema,
  EventIdSchema,
  EventPageQuerySchema,
  UpdateEventSchema,
  type CreateEventPayload,
  type EventIdPayload,
  type UpdateEventPayload,
} from "./schemas";
import { buildEventScope, canManageEvent } from "./scope";

/**
 * Reads a cursor page of events visible to the signed-in user.
 *
 * @param query - Search, sort, filter, cursor, and page-size parameters.
 * @returns A cursor page of events scoped to the caller's role and club.
 * @throws When the caller lacks `event.read` or `query` fails validation.
 */
export async function getEventPageAction(query: PageQuery): Promise<EventPage> {
  const session = await requirePermission("event.read");
  const parsed = EventPageQuerySchema.safeParse(query);
  if (!parsed.success) throw new Error("Invalid query parameters");
  return getEventPage({ scope: buildEventScope(session), query: parsed.data });
}

/**
 * Creates an event and its public QR token.
 *
 * Officers always create events for their own club; admins and developers may
 * target any club or leave it organisation-wide.
 *
 * @param payload - Title, description, venue, start, optional Facebook link, and club.
 * @returns `success: true`, or an invalid/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `event.create`.
 */
export async function createEventAction(
  payload: CreateEventPayload,
): Promise<ActionStatusResponse> {
  try {
    const session = await requirePermission("event.create");
    const parsed = CreateEventSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event");

    const scope = buildEventScope(session);
    const clubId = scope.viewAll ? parsed.data.clubId : session.clubId;
    if (!scope.viewAll && !clubId) {
      return actionConflict(
        "No club assigned",
        "Ask an administrator to assign you to a club before creating events.",
      );
    }

    await createEvent({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      venue: parsed.data.venue,
      startAt: parsed.data.startAt,
      facebookUrl: parsed.data.facebookUrl ?? null,
      clubId,
      createdById: session.id,
    });
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "create event");
  }
}

/**
 * Updates an event the caller is allowed to manage.
 *
 * @param payload - The event id plus the fields to write.
 * @returns `success: true`, or an invalid/not-found/forbidden envelope.
 * @throws {ForbiddenError} When the caller lacks `event.update`.
 */
export async function updateEventAction(
  payload: UpdateEventPayload,
): Promise<ActionStatusResponse> {
  try {
    const session = await requirePermission("event.update");
    const parsed = UpdateEventSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event");

    const existing = await getEventById(parsed.data.eventId);
    if (!existing) return actionNotFound("Event");

    const scope = buildEventScope(session);
    if (!canManageEvent(scope, existing)) return actionForbidden();

    await updateEvent({
      eventId: parsed.data.eventId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      venue: parsed.data.venue,
      startAt: parsed.data.startAt,
      facebookUrl: parsed.data.facebookUrl ?? null,
      clubId: scope.viewAll ? parsed.data.clubId : existing.clubId,
    });
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "update event");
  }
}

/**
 * Deletes an event. Restricted to administrators and developers.
 *
 * @param payload - The `eventId` to delete.
 * @returns `success: true`, or an invalid/not-found/forbidden envelope.
 * @throws {ForbiddenError} When the caller lacks `event.delete`.
 */
export async function deleteEventAction(payload: EventIdPayload): Promise<ActionStatusResponse> {
  try {
    await requirePermission("event.delete");
    const parsed = EventIdSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("event");

    const existing = await getEventById(parsed.data.eventId);
    if (!existing) return actionNotFound("Event");

    await deleteEvent(parsed.data.eventId);
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "delete event");
  }
}
