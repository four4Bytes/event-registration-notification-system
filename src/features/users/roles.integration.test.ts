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

  it("stores and returns ATTENDANCE_STAFF users and APPROVER assignments", async () => {
    const admin = await prisma.user.create({
      data: { email: "admin@acdeducation.com", name: "Admin", role: "ADMIN" },
    });
    const staff = await prisma.user.create({
      data: {
        email: "staff@acdeducation.com",
        name: "Attendance Staff",
        role: "ATTENDANCE_STAFF",
      },
    });
    const assignment = await prisma.pendingRoleAssignment.create({
      data: {
        email: "approver@acdeducation.com",
        role: "APPROVER",
        assignedById: admin.id,
      },
    });

    await expect(
      prisma.user.findUnique({ where: { id: staff.id }, select: { role: true } }),
    ).resolves.toEqual({ role: "ATTENDANCE_STAFF" });
    await expect(
      prisma.pendingRoleAssignment.findUnique({
        where: { id: assignment.id },
        select: { role: true },
      }),
    ).resolves.toEqual({ role: "APPROVER" });
  });
});
