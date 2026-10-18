import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getEventsAction, publishEventAction } from "@/features/events/actions";
import { EventStatus, Role } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";
import { UnauthorizedError } from "@/lib/security/errors";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn<() => Promise<Session | null>>() }));

vi.mock("@/lib/infra/auth", () => ({ auth: authMock }));

const sessionExpires = new Date(Date.now() + 3_600_000).toISOString();
const startAt = new Date("2026-11-01T01:00:00.000Z");

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "AuditLog", "NotificationRead", "Notification", "Attendance", "Event", "Club", "PendingRoleAssignment", "Session", "Account", "User", "VerificationToken" RESTART IDENTITY CASCADE',
  );
}

async function signInAs(role: Role, isActive = true) {
  const user = await prisma.user.create({
    data: { email: `${role.toLowerCase()}@acdeducation.com`, name: "Test User", role },
  });
  authMock.mockResolvedValue({
    expires: sessionExpires,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive,
      clubId: null,
    },
  });
  return user;
}

async function createEvent(createdById: string, status: EventStatus): Promise<{ id: string }> {
  return prisma.event.create({
    data: { title: "Open Day orientation", venue: "Main Auditorium", startAt, createdById, status },
    select: { id: true },
  });
}

async function statusOf(eventId: string): Promise<EventStatus | undefined> {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { status: true } });
  return event?.status;
}

describe("publishEventAction", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("publishes a draft event and records the actor, the role and both states", async () => {
    const officer = await signInAs(Role.OFFICER);
    const admin = await prisma.user.create({
      data: { email: "creator@acdeducation.com", name: "Ada Admin", role: Role.ADMIN },
    });
    const event = await createEvent(admin.id, EventStatus.DRAFT);

    await expect(publishEventAction({ eventId: event.id })).resolves.toEqual({ success: true });
    await expect(statusOf(event.id)).resolves.toBe(EventStatus.PUBLISHED);
    await expect(prisma.auditLog.findFirst()).resolves.toEqual({
      id: expect.any(String),
      entityType: "Event",
      entityId: event.id,
      action: "PUBLISH",
      actorId: officer.id,
      actorRole: Role.OFFICER,
      details: {
        previousState: { status: EventStatus.DRAFT },
        newState: { status: EventStatus.PUBLISHED },
      },
      createdAt: expect.any(Date),
    });
  });

  it("publishes an approved event, the only path the approval chain leaves open", async () => {
    await signInAs(Role.ADMIN);
    const creator = await prisma.user.create({
      data: { email: "creator@acdeducation.com", name: "Olive Officer", role: Role.OFFICER },
    });
    const event = await createEvent(creator.id, EventStatus.APPROVED);

    await expect(publishEventAction({ eventId: event.id })).resolves.toEqual({ success: true });
    await expect(statusOf(event.id)).resolves.toBe(EventStatus.PUBLISHED);
  });

  it.each([Role.STUDENT, Role.APPROVER, Role.DEV])(
    "refuses a %s and changes nothing",
    async (role) => {
      await signInAs(role);
      const admin = await prisma.user.create({
        data: { email: `creator-${role}@acdeducation.com`, name: "Ada Admin", role: Role.ADMIN },
      });
      const event = await createEvent(admin.id, EventStatus.DRAFT);

      await expect(publishEventAction({ eventId: event.id })).resolves.toEqual({
        success: false,
        error: {
          code: "forbidden",
          title: "Access denied",
          description: "You don't have permission to perform this action.",
        },
      });
      await expect(statusOf(event.id)).resolves.toBe(EventStatus.DRAFT);
      await expect(prisma.auditLog.count()).resolves.toBe(0);
    },
  );

  it("refuses a deactivated account", async () => {
    await signInAs(Role.OFFICER, false);
    const admin = await prisma.user.create({
      data: { email: "creator@acdeducation.com", name: "Ada Admin", role: Role.ADMIN },
    });
    const event = await createEvent(admin.id, EventStatus.DRAFT);

    await expect(publishEventAction({ eventId: event.id })).resolves.toEqual({
      success: false,
      error: {
        code: "unauthorized",
        title: "Account deactivated",
        description: "Your account has been deactivated. Please contact an administrator.",
      },
    });
    await expect(statusOf(event.id)).resolves.toBe(EventStatus.DRAFT);
    await expect(prisma.auditLog.count()).resolves.toBe(0);
  });

  it.each([EventStatus.PUBLISHED, EventStatus.REJECTED, EventStatus.CANCELLED])(
    "refuses to publish an event already in %s",
    async (status) => {
      await signInAs(Role.OFFICER);
      const admin = await prisma.user.create({
        data: { email: "creator@acdeducation.com", name: "Ada Admin", role: Role.ADMIN },
      });
      const event = await createEvent(admin.id, status);

      const response = await publishEventAction({ eventId: event.id });

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe("conflict");
      await expect(statusOf(event.id)).resolves.toBe(status);
      await expect(prisma.auditLog.count()).resolves.toBe(0);
    },
  );

  it("refuses a malformed identifier", async () => {
    await signInAs(Role.OFFICER);

    await expect(publishEventAction({ eventId: "not-an-identifier" })).resolves.toEqual({
      success: false,
      error: {
        code: "validation",
        title: "Invalid event data",
        description: "Some fields are missing or malformed. Review your input and try again.",
      },
    });
    await expect(prisma.auditLog.count()).resolves.toBe(0);
  });

  it("refuses an event that does not exist", async () => {
    await signInAs(Role.OFFICER);

    await expect(publishEventAction({ eventId: `c${"0".repeat(24)}` })).resolves.toEqual({
      success: false,
      error: {
        code: "not_found",
        title: "Event not found",
        description: "The event may have been removed. Please refresh and try again.",
      },
    });
    await expect(prisma.auditLog.count()).resolves.toBe(0);
  });
});

describe("getEventsAction", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("refuses an unauthenticated caller", async () => {
    authMock.mockResolvedValue(null);

    await expect(getEventsAction()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
