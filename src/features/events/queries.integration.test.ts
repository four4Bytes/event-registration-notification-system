import { beforeAll, describe, expect, it } from "vitest";

import { getEvents } from "@/features/events/queries";
import { EventStatus, Role } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "NotificationRead", "Notification", "Attendance", "Event", "Club", "PendingRoleAssignment", "Session", "Account", "User", "VerificationToken" RESTART IDENTITY CASCADE',
  );
}

const startAt = new Date("2026-11-01T01:00:00.000Z");

async function createEvent(
  createdById: string,
  status: EventStatus,
  title: string,
): Promise<{ id: string }> {
  return prisma.event.create({
    data: { title, venue: "Gym", startAt, createdById, status },
    select: { id: true },
  });
}

describe("getEvents", () => {
  let draft: { id: string };
  let published: { id: string };

  beforeAll(async () => {
    await resetDatabase();
    const admin = await prisma.user.create({
      data: { email: "admin@acdeducation.com", name: "Ada Admin", role: Role.ADMIN },
    });
    draft = await createEvent(admin.id, EventStatus.DRAFT, "Unapproved night");
    published = await createEvent(admin.id, EventStatus.PUBLISHED, "Published night");
  });

  it("shows a student the published event only, and nothing else about it", async () => {
    await expect(getEvents(Role.STUDENT)).resolves.toEqual([
      {
        id: published.id,
        title: "Published night",
        venue: "Gym",
        startAt,
        status: EventStatus.PUBLISHED,
      },
    ]);
  });

  it("shows staff every event, draft included", async () => {
    const rows = await getEvents(Role.OFFICER);

    expect(rows.map((row) => row.status)).toEqual([EventStatus.DRAFT, EventStatus.PUBLISHED]);
    expect(rows.map((row) => row.id)).toEqual([draft.id, published.id]);
  });
});
