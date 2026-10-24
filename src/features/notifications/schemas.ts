import { z } from "zod";

import { NotificationAudience } from "@/generated/prisma/browser";
import { requiredText } from "@/lib/validation/form-utils";

export const SendNotificationSchema = z
  .object({
    title: requiredText(160, "Title"),
    body: requiredText(5000, "Body"),
    audience: z.enum([NotificationAudience.ALL, NotificationAudience.CLUB]),
    clubId: z
      .string()
      .regex(/^c[a-z0-9]{24}$/, "Invalid club identifier")
      .nullable(),
  })
  .superRefine((value, context) => {
    if (value.audience === NotificationAudience.CLUB && !value.clubId) {
      context.addIssue({ code: "custom", path: ["clubId"], message: "Select a club" });
    }
    if (value.audience === NotificationAudience.ALL && value.clubId) {
      context.addIssue({
        code: "custom",
        path: ["clubId"],
        message: "Club must be empty for all recipients",
      });
    }
  });

export const MarkNotificationReadSchema = z.object({
  notificationId: z.string().regex(/^c[a-z0-9]{24}$/, "Invalid notification identifier"),
});

export const NotificationStatusFilterSchema = z.enum(["unread", "read"]);

export const NotificationPageQuerySchema = z.object({
  search: z.string().max(200).optional(),
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
      status: z.array(NotificationStatusFilterSchema).max(2).optional(),
    })
    .optional(),
});

export type SendNotificationPayload = z.input<typeof SendNotificationSchema>;
export type MarkNotificationReadPayload = z.input<typeof MarkNotificationReadSchema>;
