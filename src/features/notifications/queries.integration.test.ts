import { beforeAll, describe, expect, it } from "vitest";

import { getNotificationsForUser } from "@/features/notifications/queries";
import { prisma } from "@/lib/infra/prisma";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "NotificationRead", "Notification", "Attendance", "Event", "Club", "PendingRoleAssignment", "Session", "Account", "User", "VerificationToken" RESTART IDENTITY CASCADE',
  );
}

describe("getNotificationsForUser", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("returns the ALL notice and the member club notice with read state", async () => {
    const club = await prisma.club.create({ data: { name: "Robotics" } });
    const member = await prisma.user.create({
      data: {
        email: "member@acdeducation.com",
        name: "Club Member",
        clubId: club.id,
      },
    });
    const sender = await prisma.user.create({
      data: {
        email: "officer@acdeducation.com",
        name: "Notifier",
        role: "OFFICER",
      },
    });
    const allNotice = await prisma.notification.create({
      data: {
        title: "Campus assembly",
        body: "All students are invited.",
        audience: "ALL",
        createdById: sender.id,
      },
    });
    const clubNotice = await prisma.notification.create({
      data: {
        title: "Robotics meeting",
        body: "Club members only.",
        audience: "CLUB",
        clubId: club.id,
        createdById: sender.id,
      },
    });
    await prisma.notificationRead.create({
      data: { notificationId: allNotice.id, userId: member.id },
    });

    const rows = await getNotificationsForUser(member.id, club.id);

    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: allNotice.id,
          title: "Campus assembly",
          audience: "ALL",
          clubName: null,
          isRead: true,
        }),
        expect.objectContaining({
          id: clubNotice.id,
          title: "Robotics meeting",
          audience: "CLUB",
          clubName: "Robotics",
          isRead: false,
        }),
      ]),
    );
  });
});
