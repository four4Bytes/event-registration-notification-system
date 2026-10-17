import { z } from "zod";

import { Role } from "@/generated/prisma/browser";
import { emailText, requiredText } from "@/lib/validation/form-utils";

export const AssignableRoleSchema = z.enum([
  Role.STUDENT,
  Role.OFFICER,
  Role.ADMIN,
  Role.APPROVER,
]);

const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, "Invalid user identifier");

export const UserIdSchema = z.object({ userId: cuidSchema });

export const UserActiveSchema = UserIdSchema.extend({ isActive: z.boolean() });

export const UpdateRoleSchema = z.object({
  userId: cuidSchema,
  role: AssignableRoleSchema,
});

export const AddPendingUserSchema = z.object({
  email: emailText("Email").refine((value) => value.toLowerCase().endsWith("@acdeducation.com"), {
    message: "Email must end in @acdeducation.com",
  }),
  role: AssignableRoleSchema,
});

export const UserSearchSchema = z.object({
  search: requiredText(100, "Search").optional().default(""),
});
