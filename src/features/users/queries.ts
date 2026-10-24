import { Role } from "@/generated/prisma/browser";
import { Prisma } from "@/generated/prisma/client";
import {
  decodeTimestampCursor,
  encodeTimestampCursor,
  resolveCursorPageSize,
  type CursorPage,
  type TimestampCursor,
} from "@/lib/domain/pagination";
import { prisma } from "@/lib/infra/prisma";

export interface UserManagementRow {
  kind: "user" | "pending";
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean | null;
  clubId: string | null;
  clubName: string | null;
  clubShortName: string | null;
  createdAt: Date;
}

export type UserManagementPage = CursorPage<UserManagementRow>;

export type UserStatusFilter = "active" | "inactive" | "pending";

export interface UserManagementPageQuery {
  search?: string;
  cursor?: string;
  pageSize?: number;
  role?: Role[];
  status?: UserStatusFilter[];
}

function buildUserCursorFilter(cursor: TimestampCursor | null): Prisma.UserWhereInput {
  if (!cursor) return {};
  return {
    OR: [
      { createdAt: { lt: cursor.timestamp } },
      { createdAt: cursor.timestamp, id: { lt: cursor.id } },
    ],
  };
}

function buildPendingCursorFilter(
  cursor: TimestampCursor | null,
): Prisma.PendingRoleAssignmentWhereInput {
  if (!cursor) return {};
  return {
    OR: [
      { assignedAt: { lt: cursor.timestamp } },
      { assignedAt: cursor.timestamp, id: { lt: cursor.id } },
    ],
  };
}

function compareRowsDescending(left: UserManagementRow, right: UserManagementRow): number {
  const byCreatedAt = right.createdAt.getTime() - left.createdAt.getTime();
  if (byCreatedAt !== 0) return byCreatedAt;
  if (left.id === right.id) return 0;
  return left.id < right.id ? 1 : -1;
}

function buildUserSearchFilter(search: string): Prisma.UserWhereInput {
  return search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
}

function buildPendingSearchFilter(search: string): Prisma.PendingRoleAssignmentWhereInput {
  return search ? { email: { contains: search, mode: "insensitive" } } : {};
}

export async function getUserManagementPage(
  query: UserManagementPageQuery = {},
): Promise<UserManagementPage> {
  const { search = "", cursor: rawCursor, pageSize, role = [], status = [] } = query;
  const resolvedPageSize = resolveCursorPageSize(pageSize);
  const take = resolvedPageSize + 1;
  const cursor = decodeTimestampCursor(rawCursor);
  const normalizedSearch = search.trim();
  const wantsActive = status.includes("active");
  const wantsInactive = status.includes("inactive");
  const wantsPending = status.includes("pending");
  const hasStatusFilter = status.length > 0;
  const includeUsers = !hasStatusFilter || wantsActive || wantsInactive;
  const includePending = !hasStatusFilter || wantsPending;

  const [users, pending] = await Promise.all([
    includeUsers
      ? prisma.user.findMany({
          where: {
            ...buildUserSearchFilter(normalizedSearch),
            ...(role.length > 0 ? { role: { in: role } } : {}),
            ...(wantsActive !== wantsInactive ? { isActive: wantsActive } : {}),
            ...buildUserCursorFilter(cursor),
          },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            clubId: true,
            club: { select: { name: true, shortName: true } },
          },
        })
      : [],
    includePending
      ? prisma.pendingRoleAssignment.findMany({
          where: {
            ...buildPendingSearchFilter(normalizedSearch),
            ...(role.length > 0 ? { role: { in: role } } : {}),
            ...buildPendingCursorFilter(cursor),
          },
          orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
          take,
          select: {
            id: true,
            email: true,
            role: true,
            assignedAt: true,
            clubId: true,
            club: { select: { name: true, shortName: true } },
          },
        })
      : [],
  ]);

  const merged = [
    ...users.map((user) => ({
      kind: "user" as const,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      clubId: user.clubId,
      clubName: user.club?.name ?? null,
      clubShortName: user.club?.shortName ?? null,
      createdAt: user.createdAt,
    })),
    ...pending.map((assignment) => ({
      kind: "pending" as const,
      id: assignment.id,
      name: null,
      email: assignment.email,
      role: assignment.role,
      isActive: null,
      clubId: assignment.clubId,
      clubName: assignment.club?.name ?? null,
      clubShortName: assignment.club?.shortName ?? null,
      createdAt: assignment.assignedAt,
    })),
  ].sort(compareRowsDescending);

  const hasMore = merged.length > resolvedPageSize;
  const page = hasMore ? merged.slice(0, resolvedPageSize) : merged;
  const last = page.at(-1);

  return {
    rows: page,
    nextCursor:
      hasMore && last ? encodeTimestampCursor({ timestamp: last.createdAt, id: last.id }) : null,
  };
}

export async function getUserById(
  userId: string,
): Promise<{ id: string; role: Role; isActive: boolean | null } | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });
}

export async function countActivePrivilegedUsers(excludeUserId?: string): Promise<number> {
  return prisma.user.count({
    where: {
      isActive: true,
      role: { in: [Role.ADMIN, Role.DEV] },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

// Development-only sign-in list (ADR-0008): only the accounts the seed creates.
export async function getDevSignInAccounts() {
  return prisma.user.findMany({
    where: { email: { in: DEMO_ACCOUNTS.map((account) => account.email) } },
    select: { email: true, role: true },
    orderBy: { email: "asc" },
  });
}
