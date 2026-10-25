import { beforeEach, describe, expect, it, vi } from "vitest";

import { OfficerPosition, Role } from "@/generated/prisma/browser";
import { DeactivatedError, ForbiddenError, UnauthorizedError } from "@/lib/security/errors";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/lib/infra/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/infra/prisma", () => ({
  getAuthAdapterClient: () => ({ user: { findUnique: mocks.findUnique } }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { requireClubPermission, requirePermission } from "@/lib/security/auth-guards";

interface SessionOverrides {
  role?: Role;
  clubId?: string | null;
  officerPosition?: OfficerPosition | null;
  isActive?: boolean;
}

function signIn(overrides: SessionOverrides = {}) {
  mocks.auth.mockResolvedValue({
    user: {
      id: "user-1",
      email: "officer@example.com",
      name: "Officer",
      role: Role.OFFICER,
      isActive: true,
      clubId: "club-1",
      officerPosition: null,
      ...overrides,
    },
  });
}

function freshRow(overrides: SessionOverrides = {}) {
  mocks.findUnique.mockResolvedValue({
    role: Role.OFFICER,
    isActive: true,
    clubId: "club-1",
    officerPosition: null,
    ...overrides,
  });
}

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.findUnique.mockReset();
});

describe("requirePermission", () => {
  it("allows a President to compose notifications", async () => {
    signIn({ officerPosition: OfficerPosition.PRESIDENT });

    await expect(requirePermission("notification.create")).resolves.toMatchObject({
      id: "user-1",
      officerPosition: OfficerPosition.PRESIDENT,
    });
  });

  it("denies a plain officer composing notifications", async () => {
    signIn();

    await expect(requirePermission("notification.create")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows an Admin to assign a President", async () => {
    signIn({ role: Role.ADMIN, clubId: null });

    await expect(requirePermission("officer.assign_president")).resolves.toMatchObject({
      role: Role.ADMIN,
    });
  });

  it("denies a Student reading their own tasks", async () => {
    signIn({ role: Role.STUDENT });

    await expect(requirePermission("task.read_own")).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("requireClubPermission", () => {
  it("allows a President to scan any event in their club", async () => {
    signIn({ officerPosition: OfficerPosition.PRESIDENT });
    freshRow({ officerPosition: OfficerPosition.PRESIDENT });

    await expect(requireClubPermission("attendance.scan", "club-1")).resolves.toMatchObject({
      clubId: "club-1",
    });
  });

  it("denies a President replaced mid-session even when the token still says President", async () => {
    signIn({ officerPosition: OfficerPosition.PRESIDENT });
    freshRow({ officerPosition: null });

    await expect(requireClubPermission("task.assign", "club-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("denies a cross-club attempt", async () => {
    signIn({ officerPosition: OfficerPosition.PRESIDENT });
    freshRow({ officerPosition: OfficerPosition.PRESIDENT, clubId: "club-1" });

    await expect(requireClubPermission("task.assign", "club-2")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("denies an Admin scanning", async () => {
    signIn({ role: Role.ADMIN, clubId: null });
    freshRow({ role: Role.ADMIN, clubId: null });

    await expect(requireClubPermission("attendance.scan", "club-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("denies a plain officer reading club-wide tasks", async () => {
    signIn();
    freshRow();

    await expect(requireClubPermission("task.read_club", "club-1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows a plain officer reading their own tasks in their club", async () => {
    signIn();
    freshRow();

    await expect(requireClubPermission("task.read_own", "club-1")).resolves.toMatchObject({
      id: "user-1",
    });
  });

  it("denies a deactivated user from the fresh row", async () => {
    signIn();
    freshRow({ isActive: false });

    await expect(requireClubPermission("task.read_own", "club-1")).rejects.toBeInstanceOf(
      DeactivatedError,
    );
  });

  it("denies a deleted user", async () => {
    signIn();
    mocks.findUnique.mockResolvedValue(null);

    await expect(requireClubPermission("task.read_own", "club-1")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
