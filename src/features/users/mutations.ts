import { OfficerPosition, Role } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

export interface PendingRoleAssignmentPayload {
  email: string;
  role: Role;
  officerPosition: OfficerPosition | null;
  allowExternalEmail: boolean;
  assignedById: string;
  clubId: string | null;
}

export interface OfficerPositionPayload {
  userId: string;
  officerPosition: OfficerPosition | null;
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
  await prisma.user.update({
    where: { id: userId },
    data: { role, ...(role === Role.OFFICER ? {} : { officerPosition: null }) },
  });
}

export async function setUserActive(userId: string, isActive: boolean): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { isActive } });
}

export async function setUserClub(userId: string, clubId: string | null): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { clubId: true } });
  const clubChanged = user?.clubId !== clubId;
  await prisma.user.update({
    where: { id: userId },
    data: { clubId, ...(clubChanged ? { officerPosition: null } : {}) },
  });
}

export async function upsertPendingRoleAssignment(
  payload: PendingRoleAssignmentPayload,
): Promise<void> {
  const { email, role, allowExternalEmail, assignedById, clubId } = payload;
  const officerPosition = role === Role.OFFICER ? payload.officerPosition : null;
  await prisma.pendingRoleAssignment.upsert({
    where: { email },
    update: {
      role,
      officerPosition,
      allowExternalEmail,
      assignedById,
      clubId,
      assignedAt: new Date(),
    },
    create: { email, role, officerPosition, allowExternalEmail, assignedById, clubId },
  });
}

export async function deletePendingRoleAssignment(roleAssignmentId: string): Promise<void> {
  await prisma.pendingRoleAssignment.delete({ where: { id: roleAssignmentId } });
}

export async function setOfficerPosition(payload: OfficerPositionPayload): Promise<void> {
  const { userId, officerPosition } = payload;
  await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { clubId: true },
    });
    if (!target?.clubId) throw new Error("Officer has no club");

    if (officerPosition === OfficerPosition.PRESIDENT) {
      await tx.user.updateMany({
        where: {
          clubId: target.clubId,
          officerPosition: OfficerPosition.PRESIDENT,
          id: { not: userId },
        },
        data: { officerPosition: null },
      });
    }

    await tx.user.update({ where: { id: userId }, data: { officerPosition } });
  });
}
