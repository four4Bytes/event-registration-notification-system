import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { writeAuditLog } from "@/features/audit/write-audit-log";
import { Role } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";
import { DeactivatedError, UnauthorizedError } from "@/lib/security/errors";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn<() => Promise<Session | null>>() }));

vi.mock("@/lib/infra/auth", () => ({ auth: authMock }));

const sessionExpires = new Date(Date.now() + 3_600_000).toISOString();

async function createActor(role: Role) {
  return prisma.user.create({
    data: { email: `actor-${role}@acdeducation.com`, name: "Audit Actor", role },
  });
}

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE "AuditLog", "User" RESTART IDENTITY CASCADE');
}

describe("writeAuditLog", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("records the actor, their role, the time, the action, the entity and the old and new state", async () => {
    const actor = await createActor(Role.ADMIN);
    authMock.mockResolvedValue({
      expires: sessionExpires,
      user: {
        id: actor.id,
        email: actor.email,
        name: actor.name,
        role: actor.role,
        isActive: true,
        clubId: null,
      },
    });

    const before = Date.now();
    await writeAuditLog({
      entityType: "Event",
      entityId: "event-1",
      action: "PUBLISH",
      previousState: { status: "APPROVED" },
      newState: { status: "PUBLISHED" },
    });

    const row = await prisma.auditLog.findFirst();
    expect(row).toEqual({
      id: expect.any(String),
      entityType: "Event",
      entityId: "event-1",
      action: "PUBLISH",
      actorId: actor.id,
      actorRole: Role.ADMIN,
      details: { previousState: { status: "APPROVED" }, newState: { status: "PUBLISHED" } },
      createdAt: expect.any(Date),
    });
    expect(row!.createdAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it("refuses an unauthenticated caller and writes nothing", async () => {
    authMock.mockResolvedValue(null);

    await expect(
      writeAuditLog({ entityType: "Event", entityId: "event-1", action: "PUBLISH" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(prisma.auditLog.count()).resolves.toBe(0);
  });

  it("refuses a deactivated caller and writes nothing", async () => {
    const actor = await createActor(Role.OFFICER);
    authMock.mockResolvedValue({
      expires: sessionExpires,
      user: {
        id: actor.id,
        email: actor.email,
        name: actor.name,
        role: actor.role,
        isActive: false,
        clubId: null,
      },
    });

    await expect(
      writeAuditLog({ entityType: "Event", entityId: "event-1", action: "PUBLISH" }),
    ).rejects.toBeInstanceOf(DeactivatedError);
    await expect(prisma.auditLog.count()).resolves.toBe(0);
  });
});
