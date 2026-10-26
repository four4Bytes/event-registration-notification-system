import { z } from "zod";

import { EventStatus } from "@/generated/prisma/browser";
import { optionalText, requiredText } from "@/lib/validation/form-utils";

const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, "Invalid event identifier");

const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "fb.com",
  "www.fb.com",
  "fb.me",
  "www.fb.me",
]);

/**
 * Checks whether a value is a well-formed Facebook event URL.
 *
 * Only public `http(s)` links on Facebook-owned hosts with a non-root path are
 * accepted. The system never fetches the page, so private or inaccessible
 * events remain readable only in the application's own saved details.
 *
 * @param value - The candidate URL.
 * @returns True when the URL points at a Facebook event path.
 */
export function isFacebookEventUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const protocolAllowed = url.protocol === "https:" || url.protocol === "http:";
    return (
      protocolAllowed && FACEBOOK_HOSTS.has(url.hostname.toLowerCase()) && url.pathname.length > 1
    );
  } catch {
    return false;
  }
}

export const EventIdSchema = z.object({ eventId: cuidSchema });

export const EventTokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{32}$/, "Invalid event QR code");

const FacebookUrlSchema = z
  .string()
  .trim()
  .max(500, "Facebook link must be at most 500 characters")
  .refine(isFacebookEventUrl, "Enter a valid Facebook event link")
  .optional();

const EventWriteSchema = z.object({
  title: requiredText(160, "Title"),
  description: optionalText(5000, "Description"),
  venue: requiredText(200, "Location"),
  startAt: z.date({ error: "Select a date and time" }),
  facebookUrl: FacebookUrlSchema,
  clubId: cuidSchema.nullable().default(null),
});

export const CreateEventSchema = EventWriteSchema;

export const UpdateEventSchema = EventWriteSchema.extend({ eventId: cuidSchema });

export const EventStatusFilterSchema = z.enum(EventStatus);

export const EventPageQuerySchema = z.object({
  search: optionalText(200, "Search", true),
  cursor: z.string().max(500).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
  sort: z
    .object({
      column: z.string(),
      direction: z.enum(["asc", "desc"]),
    })
    .optional(),
  filters: z
    .object({
      status: z.array(EventStatusFilterSchema).max(4).optional(),
    })
    .optional(),
});

export type CreateEventPayload = z.input<typeof CreateEventSchema>;
export type UpdateEventPayload = z.input<typeof UpdateEventSchema>;
export type EventIdPayload = z.input<typeof EventIdSchema>;
