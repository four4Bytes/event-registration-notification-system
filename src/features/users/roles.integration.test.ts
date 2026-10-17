import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/infra/prisma";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "NotificationRead", "Notification", "Attendance", "Event", "Club", "PendingRoleAssignment", "Session", "Account", "User", "VerificationToken" RESTART IDENTITY CASCADE',
  );
}

describe("role enum migration", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("stores OFFICER users and APPROVER assignments, and the Role enum no longer has ATTENDANCE_STAFF", async () => {
    const admin = await prisma.user.create({
      data: { email: "admin@acdeducation.com", name: "Admin", role: "ADMIN" },
    });
    const officer = await prisma.user.create({
      data: { email: "officer@acdeducation.com", name: "Officer", role: "OFFICER" },
    });
    const assignment = await prisma.pendingRoleAssignment.create({
      data: {
        email: "approver@acdeducation.com",
        role: "APPROVER",
        assignedById: admin.id,
      },
    });

    await expect(
      prisma.user.findUnique({ where: { id: officer.id }, select: { role: true } }),
    ).resolves.toEqual({ role: "OFFICER" });
    await expect(
      prisma.pendingRoleAssignment.findUnique({
        where: { id: assignment.id },
        select: { role: true },
      }),
    ).resolves.toEqual({ role: "APPROVER" });

    await expect(prisma.$queryRawUnsafe(`SELECT 'APPROVER'::"Role"`)).resolves.toBeDefined();
    await expect(prisma.$queryRawUnsafe(`SELECT 'ATTENDANCE_STAFF'::"Role"`)).rejects.toThrow(
      /invalid input value for enum/,
    );
  });
});
