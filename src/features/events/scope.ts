import { EventStatus, type Role } from "@/generated/prisma/browser";
import { can, eventVisibility } from "@/lib/security/rbac";

/** Visibility window for event reads, resolved from the caller's role. */
export interface EventScope {
  userId: string;
  role: Role;
  clubId: string | null;
  viewAll: boolean;
}

/** Minimal session projection needed to build an {@link EventScope}. */
export interface EventScopeUser {
  id: string;
  role: Role;
  clubId: string | null;
}

/** Event fields needed to decide whether the caller may see it. */
export interface ScopedEvent {
  createdById: string;
  clubId: string | null;
  status: EventStatus;
}

/**
 * Builds the event visibility scope for a signed-in user.
 *
 * @param user - The authenticated user's id, role, and club.
 * @returns The scope used by event queries and page guards.
 */
export function buildEventScope(user: EventScopeUser): EventScope {
  return {
    userId: user.id,
    role: user.role,
    clubId: user.clubId,
    viewAll: eventVisibility(user.role) === "global",
  };
}

/**
 * Decides whether a scope may read an event.
 *
 * Approved events are readable by every signed-in user who holds
 * `event.read` - a QR poster in another building must work when scanned.
 * Non-approved events stay private to their creator, admins, and officers of
 * the owning club.
 *
 * @param scope - The caller's event scope.
 * @param event - The event being read.
 * @returns True when the event may be shown to the caller.
 */
export function canViewEvent(scope: EventScope, event: ScopedEvent): boolean {
  if (scope.viewAll) return true;
  if (event.status === EventStatus.APPROVED) return true;
  if (event.createdById === scope.userId) return true;

  const inClub = event.clubId !== null && event.clubId === scope.clubId;
  return inClub && scope.role !== "STUDENT";
}

/**
 * Decides whether a scope may edit or delete an event.
 *
 * Admins and developers manage every event; officers manage events owned by
 * their own club. The helper mirrors the `event.update` permission so the UI
 * never offers an action the Server Action would reject.
 *
 * @param scope - The caller's event scope.
 * @param event - The event being managed.
 * @returns True when the caller may mutate the event.
 */
export function canManageEvent(scope: EventScope, event: Pick<ScopedEvent, "clubId">): boolean {
  if (!can(scope.role, "event.update")) return false;
  if (scope.viewAll) return true;
  return event.clubId !== null && event.clubId === scope.clubId;
}
