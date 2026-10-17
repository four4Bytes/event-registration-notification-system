import type { Role } from "@/generated/prisma/browser";
import { DEMO_ACCOUNTS } from "@/lib/infra/demo-accounts";
import { prisma } from "@/lib/infra/prisma";

export interface UserManagementRow {
  kind: "user" | "pending";
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean | null;
  createdAt: Date;
}

export async function getUserManagementRows(search = ""): Promise<UserManagementRow[]> {
  const normalizedSearch = search.trim();
  const users = await prisma.user.findMany({
    where: normalizedSearch
      ? {
          OR: [
            { name: { contains: normalizedSearch, mode: "insensitive" } },
            { email: { contains: normalizedSearch, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  const pending = await prisma.pendingRoleAssignment.findMany({
    where: normalizedSearch
      ? { email: { contains: normalizedSearch, mode: "insensitive" } }
      : undefined,
    select: { id: true, email: true, role: true, assignedAt: true },
  });

  return [
    ...users.map((user) => ({
      kind: "user" as const,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    })),
    ...pending.map((assignment) => ({
      kind: "pending" as const,
      id: assignment.id,
      name: null,
      email: assignment.email,
      role: assignment.role,
      isActive: null,
      createdAt: assignment.assignedAt,
    })),
  ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
}

export async function getClubs() {
  return prisma.club.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

// Development-only sign-in list (ADR-0008): only the accounts the seed creates.
export async function getDevSignInAccounts() {
  return prisma.user.findMany({
    where: { email: { in: DEMO_ACCOUNTS.map((account) => account.email) } },
    select: { email: true, role: true },
    orderBy: { email: "asc" },
  });
}
