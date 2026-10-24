import { z } from "zod";

import { optionalText, requiredText } from "@/lib/validation/form-utils";

const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, "Invalid club identifier");

export const ClubIdSchema = z.object({ clubId: cuidSchema });

export const ClubNameSchema = requiredText(100, "Club name");

export const ClubShortNameSchema = optionalText(20, "Short name").transform((value) =>
  value?.toUpperCase(),
);

export const CreateClubSchema = z.object({
  name: ClubNameSchema,
  shortName: ClubShortNameSchema,
});

export const UpdateClubSchema = CreateClubSchema.extend({ clubId: cuidSchema });

export const ClubPageQuerySchema = z.object({
  search: optionalText(100, "Search", true),
  cursor: z.string().max(500).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
});

export type ClubIdPayload = z.input<typeof ClubIdSchema>;
export type CreateClubPayload = z.input<typeof CreateClubSchema>;
export type UpdateClubPayload = z.input<typeof UpdateClubSchema>;
