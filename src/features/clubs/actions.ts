"use server";

import type { PageQuery } from "@/lib/primitives/types";
import {
  actionConflict,
  actionInvalid,
  actionNotFound,
  type ActionStatusResponse,
} from "@/lib/security/action-response";
import { requirePermission } from "@/lib/security/auth-guards";
import { toActionResponse } from "@/lib/security/errors";

import { createClub, deleteClub, updateClub } from "./mutations";
import {
  findClubsByName,
  findClubsByShortName,
  getClubById,
  getClubOptions,
  getClubPage,
  getClubUsage,
  type ClubOption,
  type ClubPage,
} from "./queries";
import {
  ClubIdSchema,
  ClubPageQuerySchema,
  CreateClubSchema,
  UpdateClubSchema,
  type ClubIdPayload,
  type CreateClubPayload,
  type UpdateClubPayload,
} from "./schemas";

async function findClubConflict(name: string, shortName: string | null, excludeClubId?: string) {
  const nameMatch = (await findClubsByName(name, excludeClubId))[0];
  if (nameMatch) {
    return actionConflict(
      "Club already exists",
      `A club named "${nameMatch.name}" already exists.`,
    );
  }
  if (shortName) {
    const shortNameMatch = (await findClubsByShortName(shortName, excludeClubId))[0];
    if (shortNameMatch) {
      return actionConflict(
        "Short name already in use",
        `The short name "${shortNameMatch.shortName}" is already used by another club.`,
      );
    }
  }
  return null;
}

/**
 * Lists clubs as picker options for the notification composer and user forms.
 *
 * @returns Every club as an `{ id, name, shortName }` option, sorted by name.
 * @throws {ForbiddenError} When the caller holds neither `notification.create` nor `user.update`.
 */
export async function getClubOptionsAction(): Promise<ClubOption[]> {
  await requirePermission("notification.create", "user.update");
  return getClubOptions();
}

/**
 * Reads a cursor page of clubs for the admin clubs table.
 *
 * @param query - Search, cursor, and page-size parameters from the table.
 * @returns A cursor page of club rows.
 * @throws When the caller lacks `club.read` or `query` fails validation.
 */
export async function getClubPageAction(query: PageQuery): Promise<ClubPage> {
  await requirePermission("club.read");
  const parsed = ClubPageQuerySchema.safeParse(query);
  if (!parsed.success) throw new Error("Invalid query parameters");
  return getClubPage({
    search: parsed.data.search,
    cursor: parsed.data.cursor,
    pageSize: parsed.data.pageSize,
  });
}

/**
 * Creates a club after checking that its name and short name are unique.
 *
 * @param payload - The club write fields (`name`, `shortName`).
 * @returns `success: true`, or an invalid/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `club.create`.
 */
export async function createClubAction(payload: CreateClubPayload): Promise<ActionStatusResponse> {
  try {
    await requirePermission("club.create");
    const parsed = CreateClubSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("club");
    const conflict = await findClubConflict(parsed.data.name, parsed.data.shortName ?? null);
    if (conflict) return conflict;
    await createClub({ name: parsed.data.name, shortName: parsed.data.shortName ?? null });
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "create club");
  }
}

/**
 * Updates an existing club while keeping name and short-name uniqueness.
 *
 * @param payload - The club id plus write fields.
 * @returns `success: true`, or an invalid/not-found/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `club.update`.
 */
export async function updateClubAction(payload: UpdateClubPayload): Promise<ActionStatusResponse> {
  try {
    await requirePermission("club.update");
    const parsed = UpdateClubSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("club");
    const existing = await getClubById(parsed.data.clubId);
    if (!existing) return actionNotFound("Club");
    const conflict = await findClubConflict(
      parsed.data.name,
      parsed.data.shortName ?? null,
      parsed.data.clubId,
    );
    if (conflict) return conflict;
    await updateClub({
      clubId: parsed.data.clubId,
      name: parsed.data.name,
      shortName: parsed.data.shortName ?? null,
    });
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "update club");
  }
}

/**
 * Deletes a club only when no members, events, or notifications reference it.
 *
 * @param payload - The `clubId` to delete.
 * @returns `success: true`, or an invalid/not-found/conflict envelope.
 * @throws {ForbiddenError} When the caller lacks `club.delete`.
 */
export async function deleteClubAction(payload: ClubIdPayload): Promise<ActionStatusResponse> {
  try {
    await requirePermission("club.delete");
    const parsed = ClubIdSchema.safeParse(payload);
    if (!parsed.success) return actionInvalid("club");
    const usage = await getClubUsage(parsed.data.clubId);
    if (!usage) return actionNotFound("Club");
    if (usage.memberCount + usage.eventCount + usage.notificationCount > 0) {
      return actionConflict(
        "Club in use",
        "Reassign its members and clear related records before deleting this club.",
      );
    }
    await deleteClub(parsed.data.clubId);
    return { success: true };
  } catch (error) {
    return toActionResponse(error, "delete club");
  }
}
