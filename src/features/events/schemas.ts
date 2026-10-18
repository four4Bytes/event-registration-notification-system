import { z } from "zod";

const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, "Invalid event identifier");

export const EventIdSchema = z.object({ eventId: cuidSchema });
