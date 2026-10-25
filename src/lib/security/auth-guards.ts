import { redirect } from "next/navigation";

import { OfficerPosition, Role } from "@/generated/prisma/browser";
import { auth } from "@/lib/infra/auth";
import { getAuthAdapterClient } from "@/lib/infra/prisma";
import { DeactivatedError, ForbiddenError, UnauthorizedError } from "@/lib/security/errors";
import { canWithPosition, type Permission } from "@/lib/security/rbac";

/** Minimal authenticated-user projection shared by the auth guards. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  clubId: string | null;
  officerPosition: OfficerPosition | null;
}

/**
 * Enforces an authenticated session and returns the verified user.
 *
 * @returns The authenticated user projection.
 * @throws {UnauthorizedError} when the session is missing a required field.
 * @throws {DeactivatedError} when the account has been deactivated.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email || !user.name || !user.role) throw new UnauthorizedError();
  if (user.isActive === false) throw new DeactivatedError();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    clubId: user.clubId ?? null,
    officerPosition: user.officerPosition ?? null,
  };
}

/**
 * Enforces the session and that the user holds at least one of the given
 * permissions, evaluated against the central RBAC matrix
 * (`src/lib/security/rbac.ts`).
 *
 * @param permissions - One or more granular permissions; the caller must be
 *                      granted at least one.
 * @returns The authenticated user when authorized.
 * @throws {UnauthorizedError} when there is no session.
 * @throws {ForbiddenError} when no permission is granted.
 */
export async function requirePermission(...permissions: Permission[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!permissions.some((permission) => canWithPosition(user.role, user.officerPosition, permission)))
    throw new ForbiddenError();
  return user;
}

/**
 * Enforces a club-scoped permission against the actor's current database row.
 *
 * The session is used for identity only. Role, club, and officer position are
 * re-read from the database so a President replaced mid-session is refused on
 * the next action. Admins and Devs skip the club and position checks but still
 * need the role-level grant.
 *
 * @param permission - The granular permission the action requires.
 * @param clubId - The club the action operates on.
 * @returns The authenticated user with fresh authorization fields.
 * @throws {UnauthorizedError} when the session or the user row is missing.
 * @throws {DeactivatedError} when the account has been deactivated.
 * @throws {ForbiddenError} when the permission or the club scope is denied.
 */
export async function requireClubPermission(
  permission: Permission,
  clubId: string,
): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  const fresh = await getAuthAdapterClient().user.findUnique({
    where: { id: user.id },
    select: { role: true, isActive: true, clubId: true, officerPosition: true },
  });
  if (!fresh) throw new UnauthorizedError();
  if (!fresh.isActive) throw new DeactivatedError();

  const actor: AuthenticatedUser = {
    ...user,
    role: fresh.role,
    isActive: fresh.isActive,
    clubId: fresh.clubId,
    officerPosition: fresh.officerPosition,
  };

  if (!canWithPosition(actor.role, actor.officerPosition, permission)) throw new ForbiddenError();
  if (actor.role !== Role.ADMIN && actor.role !== Role.DEV && actor.clubId !== clubId) {
    throw new ForbiddenError();
  }
  return actor;
}

/**
 * Enforces the session and permissions for a route-level Server Component.
 *
 * Unlike {@link requirePermission}, failures redirect to a user-facing notice
 * instead of throwing, so stale client navigation after a role change never
 * reaches the error boundary. Server Actions must keep using
 * {@link requirePermission} and return envelopes.
 *
 * @param permissions - One or more granular permissions; the caller must be
 *                      granted at least one.
 * @returns The authenticated user when authorized.
 */
export async function requirePagePermission(
  ...permissions: Permission[]
): Promise<AuthenticatedUser> {
  try {
    return await requirePermission(...permissions);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/sign-in");
    if (error instanceof DeactivatedError) redirect("/deactivated?reason=deactivated");
    if (error instanceof ForbiddenError) redirect("/access-denied");
    throw error;
  }
}

/**
 * Route-level variant of {@link requireClubPermission} that redirects instead
 * of throwing.
 *
 * @param permission - The granular permission the page requires.
 * @param clubId - The club the page operates on.
 * @returns The authenticated user when authorized.
 */
export async function requirePageClubPermission(
  permission: Permission,
  clubId: string,
): Promise<AuthenticatedUser> {
  try {
    return await requireClubPermission(permission, clubId);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/sign-in");
    if (error instanceof DeactivatedError) redirect("/deactivated?reason=deactivated");
    if (error instanceof ForbiddenError) redirect("/access-denied");
    throw error;
  }
}
