import type { Role } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

export interface PendingRoleAssignmentPayload {
  email: string;
  role: Role;
  allowExternalEmail: boolean;
  assignedById: string;
  clubId: string | null;
}

export async function ensureDeveloperUser(email: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return;

  try {
    await prisma.user.create({
      data: { email, name: "Developer Account", role: "DEV" },
    });
  } catch (error) {
    const concurrentUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!concurrentUser) throw error;
  }
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
}

export async function setUserClub(userId: string, clubId: string | null): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { clubId } });
}

export async function upsertPendingRoleAssignment(
  payload: PendingRoleAssignmentPayload,
): Promise<void> {
  const { email, role, allowExternalEmail, assignedById, clubId } = payload;
  await prisma.pendingRoleAssignment.upsert({
    where: { email },
    update: { role, allowExternalEmail, assignedById, clubId, assignedAt: new Date() },
    create: { email, role, allowExternalEmail, assignedById, clubId },
  });
}

export async function deletePendingRoleAssignment(roleAssignmentId: string): Promise<void> {
  await prisma.pendingRoleAssignment.delete({ where: { id: roleAssignmentId } });
}
