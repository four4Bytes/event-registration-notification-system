/**
 * Centralized RBAC policy for the application.
 *
 * {@link PERMISSION_MATRIX} is the single source of truth for what each role
 * may do, transcribed code-for-cell from `documentation/RBAC.md`. Each cell is
 * an {@link AccessLevel} (`"yes"`, `"no"`, or `"own_club"`), mirroring the
 * Access Legend codes in the documentation.
 *
 * Capabilities are enforced by `requirePermission(...)` guards; the
 * `"own_club"` level additionally constrains reads to the actor's own rows,
 * resolved by {@link notificationVisibility} and applied by feature queries.
 *
 * When a policy change is requested, edit the affected cell here and the
 * matching cell in the documentation together; every layer (Server Actions,
 * client UI, sidebar nav) reads the same matrix.
 *
 * The module is pure and client-safe: it imports only the Prisma `Role` type
 * from the `browser` entry, so it can be imported from `"use client"`
 * components and Server Actions alike.
 */

import type { Role } from "@/generated/prisma/browser";

/** Shared user-facing message for denied actions. */
export const FORBIDDEN_MESSAGE = "You don't have permission to perform this action.";

/**
 * Access level a role has on a capability.
 *
 * Mirrors the Access Legend in `documentation/RBAC.md`:
 *
 * - `"yes"` - granted everywhere.
 * - `"no"` - denied under any circumstance.
 * - `"own_club"` - granted, but scoped to organisation-wide rows and rows
 *   belonging to the actor's own club.
 */
export type AccessLevel = "yes" | "no" | "own_club";

/**
 * Granular capability a role may or may not perform, named `entity.action`.
 *
 * Deny-by-default and enforced exclusively through `requirePermission(...)`.
 * Only capabilities that are actually implemented are listed; new rows are
 * added here and in `documentation/RBAC.md` as their features land.
 */
export type Permission =
  | "user.read"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "club.read"
  | "club.create"
  | "club.update"
  | "club.delete"
  | "notification.read"
  | "notification.create"
  | "event.read"
  | "event.create"
  | "event.update"
  | "event.delete";

/**
 * Qualifier set for one matrix row, keyed by the standard application roles.
 *
 * `DEV` is a bootstrap superuser and is never part of the documented table,
 * so it is pinned to `"yes"` for every row.
 */
interface RoleCells {
  admin: AccessLevel;
  officer: AccessLevel;
  student: AccessLevel;
}

/**
 * Builds a matrix row for the standard roles, pinning `DEV` to allowed.
 *
 * @param cells - Access level per standard role for the row.
 * @returns A full `Role` → {@link AccessLevel} row for the matrix.
 */
const cells = ({ admin, officer, student }: RoleCells): Record<Role, AccessLevel> => ({
  DEV: "yes",
  ADMIN: admin,
  OFFICER: officer,
  STUDENT: student,
});

/**
 * The RBAC matrix, transcribed cell-for-cell from the tables in
 * `documentation/RBAC.md`. Edit a cell here and in the doc together.
 */
export const PERMISSION_MATRIX: Record<Permission, Record<Role, AccessLevel>> = {
  "user.read": cells({ admin: "yes", officer: "no", student: "no" }),
  "user.create": cells({ admin: "yes", officer: "no", student: "no" }),
  "user.update": cells({ admin: "yes", officer: "no", student: "no" }),
  "user.delete": cells({ admin: "yes", officer: "no", student: "no" }),

  "club.read": cells({ admin: "yes", officer: "no", student: "no" }),
  "club.create": cells({ admin: "yes", officer: "no", student: "no" }),
  "club.update": cells({ admin: "yes", officer: "no", student: "no" }),
  "club.delete": cells({ admin: "yes", officer: "no", student: "no" }),

  "notification.read": cells({ admin: "yes", officer: "own_club", student: "own_club" }),
  "notification.create": cells({ admin: "yes", officer: "yes", student: "no" }),

  "event.read": cells({ admin: "yes", officer: "own_club", student: "own_club" }),
  "event.create": cells({ admin: "yes", officer: "yes", student: "no" }),
  "event.update": cells({ admin: "yes", officer: "own_club", student: "no" }),
  "event.delete": cells({ admin: "yes", officer: "no", student: "no" }),
};

/**
 * Row scope resolved from the `notification.read` access level.
 *
 * `"global"` reads every notification regardless of audience or club;
 * `"own_club"` reads organisation-wide notifications plus those addressed to
 * the reader's own club.
 */
export type NotificationVisibility = "global" | "own_club";

/**
 * Resolves the notification read scope for a role from the access level of the
 * `notification.read` row, failing closed to the most restrictive scope for
 * `null`/`undefined` or unrecognized roles.
 *
 * @param role - The user's role (nullable, as it comes from the session).
 * @returns The role's notification row scope.
 */
export function notificationVisibility(role: Role | null | undefined): NotificationVisibility {
  if (role && PERMISSION_MATRIX["notification.read"][role] === "yes") return "global";
  return "own_club";
}

/**
 * Row scope resolved from the `event.read` access level.
 *
 * `"global"` reads every event regardless of club or status; `"own_club"`
 * reads organisation-wide events plus approved events belonging to the
 * reader's own club.
 */
export type EventVisibility = "global" | "own_club";

/**
 * Resolves the event read scope for a role from the access level of the
 * `event.read` row, failing closed to the most restrictive scope for
 * `null`/`undefined` or unrecognized roles.
 *
 * @param role - The user's role (nullable, as it comes from the session).
 * @returns The role's event row scope.
 */
export function eventVisibility(role: Role | null | undefined): EventVisibility {
  if (role && PERMISSION_MATRIX["event.read"][role] === "yes") return "global";
  return "own_club";
}

/**
 * Evaluates whether a role may perform a permission.
 *
 * A capability is granted for any non-`"no"` access level (`"own_club"` implies
 * the row is readable within scope). Returns `false` for `null`/`undefined`
 * roles, or for role values not present in the {@link Role} enum.
 *
 * @param role - The user's role (nullable, as it comes from the session).
 * @param permission - The granular action to evaluate.
 * @returns `true` when the role is permitted.
 */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const level = PERMISSION_MATRIX[permission]?.[role];
  return level === "yes" || level === "own_club";
}
