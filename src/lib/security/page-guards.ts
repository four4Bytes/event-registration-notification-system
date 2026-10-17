/**
 * Guards usable from a server component.
 *
 * A server component cannot return a status response, and a thrown error renders
 * as a 500, so a refusal here redirects to the access-denied page. Kept apart
 * from `auth-guards` because that module loads the session layer; the
 * `AuthenticatedUser` import below is type-only and erased, so this module
 * still does not load it.
 *
 * @module lib/security/page-guards
 */

import { redirect } from "next/navigation";

import type { AuthenticatedUser } from "@/lib/security/auth-guards";
import { can, type Permission } from "@/lib/security/rbac";

/**
 * Redirects the visitor unless their role holds the permission.
 *
 * @param user - The authenticated user, or anything carrying their role.
 * @param permission - The permission the page requires.
 */
export function requirePagePermission(
  user: Pick<AuthenticatedUser, "role">,
  permission: Permission,
): void {
  if (!can(user.role, permission)) redirect("/auth/error?error=Forbidden");
}
