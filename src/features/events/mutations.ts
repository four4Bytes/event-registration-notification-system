import { randomBytes } from "node:crypto";

import type { Event } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

/** Write fields shared by event create and update. */
export interface EventWriteFields {
  title: string;
  description: string | null;
  venue: string;
  startAt: Date;
  facebookUrl: string | null;
  clubId: string | null;
}

/** Payload for {@link createEvent}. */
export interface EventCreatePayload extends EventWriteFields {
  createdById: string;
}

/** Payload for {@link updateEvent}. */
export interface EventUpdatePayload extends EventWriteFields {
  eventId: string;
}

/**
 * Generates the 128-bit hex token embedded in an event's QR link.
 *
 * @returns A 32-character lowercase hex string.
 */
export function generateEventToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Creates an event with a freshly generated public QR token.
 *
 * @param payload - The event fields plus the creating user's id.
 * @returns The created event row.
 */
export async function createEvent(payload: EventCreatePayload): Promise<Event> {
  const { createdById, ...fields } = payload;
  return prisma.event.create({
    data: {
      ...fields,
      createdById,
      publicToken: generateEventToken(),
    },
  });
}

/**
 * Updates an event's editable fields.
 *
 * @param payload - The event id plus the fields to write.
 */
export async function updateEvent(payload: EventUpdatePayload): Promise<void> {
  const { eventId, ...fields } = payload;
  await prisma.event.update({ where: { id: eventId }, data: fields });
}

/**
 * Deletes an event together with its attendance records and detaches any
 * notifications that reference it.
 *
 * Notifications keep their title and body so the broadcast history stays
 * readable; only the optional `eventId` link is cleared.
 *
 * @param eventId - The event's cuid.
 */
export async function deleteEvent(eventId: string): Promise<void> {
  await prisma.$transaction([
    prisma.attendance.deleteMany({ where: { eventId } }),
    prisma.notification.updateMany({ where: { eventId }, data: { eventId: null } }),
    prisma.event.delete({ where: { id: eventId } }),
  ]);
}
