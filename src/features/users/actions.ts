"use server";

import { getClubById } from "@/features/clubs/queries";
import { Role } from "@/generated/prisma/browser";
import { sendEmail } from "@/lib/messaging/email";
import type { PageQuery } from "@/lib/primitives/types";
import {
  actionConflict,
  actionInvalid,
  actionNotFound,
  type ActionDataResponse,
  type ActionStatusResponse,
} from "@/lib/security/action-response";
import { requirePermission } from "@/lib/security/auth-guards";
import { isSchoolEmail } from "@/lib/security/email-domain";
import { toActionResponse } from "@/lib/security/errors";

import {
  deletePendingRoleAssignment,
  setUserActive,
  setUserClub,
  updateUserRole,
  upsertPendingRoleAssignment,
} from "./mutations";
import {
  countActivePrivilegedUsers,
  getUserById,
  getUserManagementPage,
  type UserManagementPage,
} from "./queries";
import {
  AddPendingUserSchema,
  PendingRoleAssignmentIdSchema,
  SetUserActiveSchema,
  SetUserClubSchema,
  UpdateUserRoleSchema,
  UserManagementPageQuerySchema,
  type AddPendingUserPayload,
  type PendingRoleAssignmentIdPayload,
  type SetUserActivePayload,
  type SetUserClubPayload,
  type UpdateUserRolePayload,
} from "./schemas";

/**
 * Reads a cursor page of users and pending role assignments for the admin table.
 *
 * @param query - Search, cursor, page-size, role, and status parameters.
 * @returns A cursor page of merged user/pending-assignment rows.
 * @throws When the caller lacks `user.read` or `query` fails validation.
 */
export async function getUserManagementPageAction(query: PageQuery): Promise<UserManagementPage> {
  await requirePermission("user.read");
  const parsed = UserManagementPageQuerySchema.safeParse(query);
  if (!parsed.success) throw new Error("Invalid query parameters");
  return getUserManagementPage({
    search: parsed.data.search,
    cursor: parsed.data.cursor,
    pageSize: parsed.data.pageSize,
    role: parsed.data.filters?.role,
    status: parsed.data.filters?.status,
  });
}

/**
 * Updates a user's role while protecting developer and last-admin accounts.
 *
 * @param payload - The target `userId` and the new `role`.
 * @returns `success: true` plus `selfDemoted`, or an invalid/not-found/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `user.update`.
 */
export async function updateUserRoleAction(
  payload: UpdateUserRolePayload,
): Promise<ActionDataResponse<{ selfDemoted: boolean }>> {
  try {
    const actor = await requirePermission("user.update");
    const parsed = UpdateUserRoleSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("user role");
    const target = await getUserById(parsed.data.userId);
    if (!target) return actionNotFound("User");
    if (target.role === Role.DEV)
      return actionConflict(
        "Developer account",
        "Developer accounts cannot be assigned through this form.",
      );
    if (target.role === Role.ADMIN && parsed.data.role !== Role.ADMIN) {
      const remaining = await countActivePrivilegedUsers(target.id);
      if (remaining === 0) {
        return actionConflict(
          "Last administrator",
          "Cannot remove the last active administrator. Assign another administrator or developer first.",
        );
      }
    }
    await updateUserRole(parsed.data.userId, parsed.data.role);
    return {
      success: true,
      data: {
        selfDemoted: actor.id === parsed.data.userId && parsed.data.role !== Role.ADMIN,
      },
    };
  } catch (error) {
    return toActionResponse(error, "update user role");
  }
}

/**
 * Activates or deactivates a user, protecting the last privileged account.
 *
 * @param payload - The target `userId` and the desired `isActive` state.
 * @returns `success: true` plus `selfDeactivated`, or an error envelope.
 * @throws {ForbiddenError} When the caller lacks `user.update`.
 */
export async function setUserActiveAction(
  payload: SetUserActivePayload,
): Promise<ActionDataResponse<{ selfDeactivated: boolean }>> {
  try {
    const session = await requirePermission("user.update");
    const parsed = SetUserActiveSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("user status");
    const target = await getUserById(parsed.data.userId);
    if (!target) return actionNotFound("User");
    if (!parsed.data.isActive && (target.role === Role.ADMIN || target.role === Role.DEV)) {
      const remaining = await countActivePrivilegedUsers(target.id);
      if (remaining === 0) {
        return actionConflict(
          "Last administrator",
          "Cannot deactivate the last active administrator or developer. Assign another administrator or developer first.",
        );
      }
    }
    await setUserActive(parsed.data.userId, parsed.data.isActive);
    return {
      success: true,
      data: { selfDeactivated: parsed.data.userId === session.id && !parsed.data.isActive },
    };
  } catch (error) {
    return toActionResponse(error, "update user status");
  }
}

/**
 * Creates or refreshes a pending role assignment and emails the invitation.
 *
 * @param payload - The email, role, optional club id, and external-email approval.
 * @returns `success: true`, or an invalid/not-found envelope.
 * @throws {ForbiddenError} When the caller lacks `user.create`.
 */
export async function addPendingUserAction(
  payload: AddPendingUserPayload,
): Promise<ActionStatusResponse> {
  try {
    const session = await requirePermission("user.create");
    const parsed = AddPendingUserSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("pending user");
    if (parsed.data.clubId) {
      const club = await getClubById(parsed.data.clubId);
      if (!club) return actionNotFound("Club");
    }
    const email = parsed.data.email.toLowerCase();
    const allowExternalEmail = parsed.data.allowExternalEmail && !isSchoolEmail(email);
    await upsertPendingRoleAssignment({
      email,
      role: parsed.data.role,
      allowExternalEmail,
      assignedById: session.id,
      clubId: parsed.data.clubId,
    });
    const signInHint = allowExternalEmail
      ? "Sign in with the Google account associated with this email address to get started."
      : "Sign in with your school account to get started.";
    await sendEmail({
      to: email,
      subject: "You have been added to ERNS",
      html: `<p>You have been added as <strong>${parsed.data.role}</strong>.</p><p>${signInHint}</p>`,
    });
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "add user");
  }
}

/**
 * Assigns a user to a club, or clears the assignment when `clubId` is null.
 *
 * @param payload - The target `userId` and optional `clubId`.
 * @returns `success: true`, or an invalid/not-found envelope.
 * @throws {ForbiddenError} When the caller lacks `user.update`.
 */
export async function setUserClubAction(
  payload: SetUserClubPayload,
): Promise<ActionStatusResponse> {
  try {
    await requirePermission("user.update");
    const parsed = SetUserClubSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("club assignment");
    const target = await getUserById(parsed.data.userId);
    if (!target) return actionNotFound("User");
    if (parsed.data.clubId) {
      const club = await getClubById(parsed.data.clubId);
      if (!club) return actionNotFound("Club");
    }
    await setUserClub(parsed.data.userId, parsed.data.clubId);
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "assign club");
  }
}

/**
 * Cancels a pending role assignment so the invitee loses the pre-assigned role.
 *
 * @param payload - The pending `roleAssignmentId` to delete.
 * @returns `success: true`, or an invalid envelope.
 * @throws {ForbiddenError} When the caller lacks `user.delete`.
 */
export async function cancelPendingInvitationAction(
  payload: PendingRoleAssignmentIdPayload,
): Promise<ActionStatusResponse> {
  try {
    await requirePermission("user.delete");
    const parsed = PendingRoleAssignmentIdSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("pending assignment");
    await deletePendingRoleAssignment(parsed.data.roleAssignmentId);
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "cancel pending assignment");
  }
}
