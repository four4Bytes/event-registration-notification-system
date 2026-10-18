import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/infra/prisma";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "NotificationRead", "Notification", "Attendance", "Event", "Club", "PendingRoleAssignment", "Session", "Account", "User", "VerificationToken" RESTART IDENTITY CASCADE',
  );
}

describe("event status migration", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("offers the seven lifecycle states and nothing else", async () => {
    const rows = await prisma.$queryRawUnsafe<Array<{ value: string }>>(
      `SELECT unnest(enum_range(NULL::"EventStatus"))::text AS value`,
    );

    expect(rows.map((row) => row.value).sort()).toEqual([
      "APPROVED",
      "CANCELLED",
      "DRAFT",
      "PENDING_APPROVAL",
      "PUBLISHED",
      "REJECTED",
      "REVISION_REQUESTED",
    ]);
  });

  it("gives a new event the DRAFT status without the caller asking", async () => {
    const admin = await prisma.user.create({
      data: { email: "admin@acdeducation.com", name: "Ada Admin", role: "ADMIN" },
    });

    const event = await prisma.event.create({
      data: {
        title: "Open Day orientation",
        venue: "Main Auditorium",
        startAt: new Date("2026-11-01T01:00:00.000Z"),
        createdById: admin.id,
      },
    });

    await expect(
      prisma.event.findUnique({ where: { id: event.id }, select: { status: true } }),
    ).resolves.toEqual({ status: "DRAFT" });
  });
});
