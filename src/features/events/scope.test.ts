import { describe, expect, it } from "vitest";

import { EventStatus, Role } from "@/generated/prisma/browser";

import {
  buildEventScope,
  canManageEvent,
  canViewEvent,
  type EventScope,
  type ScopedEvent,
} from "./scope";

const LITS_CLUB_ID = "club-lits";
const RCY_CLUB_ID = "club-rcy";

const adminScope: EventScope = {
  userId: "user-admin",
  role: Role.ADMIN,
  clubId: null,
  viewAll: true,
};

const litsOfficerScope: EventScope = {
  userId: "user-officer",
  role: Role.OFFICER,
  clubId: LITS_CLUB_ID,
  viewAll: false,
};

const rcyStudentScope: EventScope = {
  userId: "user-student",
  role: Role.STUDENT,
  clubId: RCY_CLUB_ID,
  viewAll: false,
};

function makeEvent(overrides: Partial<ScopedEvent> = {}): ScopedEvent {
  return {
    createdById: "user-other",
    clubId: LITS_CLUB_ID,
    status: EventStatus.APPROVED,
    ...overrides,
  };
}

describe("buildEventScope", () => {
  it("marks admins as global readers", () => {
    expect(buildEventScope({ id: "user-admin", role: Role.ADMIN, clubId: null })).toEqual({
      userId: "user-admin",
      role: Role.ADMIN,
      clubId: null,
      viewAll: true,
    });
  });

  it("keeps officers scoped to their club", () => {
    expect(
      buildEventScope({ id: "user-officer", role: Role.OFFICER, clubId: LITS_CLUB_ID }),
    ).toEqual({
      userId: "user-officer",
      role: Role.OFFICER,
      clubId: LITS_CLUB_ID,
      viewAll: false,
    });
  });
});

describe("canViewEvent", () => {
  it("lets any signed-in role open an approved event from another club", () => {
    expect(canViewEvent(rcyStudentScope, makeEvent())).toBe(true);
  });

  it("hides pending events from students, even in their own club", () => {
    expect(
      canViewEvent(
        rcyStudentScope,
        makeEvent({ clubId: RCY_CLUB_ID, status: EventStatus.PENDING }),
      ),
    ).toBe(false);
  });

  it("lets officers see pending events owned by their club", () => {
    expect(canViewEvent(litsOfficerScope, makeEvent({ status: EventStatus.PENDING }))).toBe(true);
  });

  it("hides pending events owned by another club from officers", () => {
    expect(
      canViewEvent(
        litsOfficerScope,
        makeEvent({ clubId: RCY_CLUB_ID, status: EventStatus.PENDING }),
      ),
    ).toBe(false);
  });

  it("lets creators read their own pending event", () => {
    expect(
      canViewEvent(
        rcyStudentScope,
        makeEvent({
          createdById: rcyStudentScope.userId,
          clubId: RCY_CLUB_ID,
          status: EventStatus.PENDING,
        }),
      ),
    ).toBe(true);
  });

  it("lets admins read events in any state", () => {
    expect(
      canViewEvent(adminScope, makeEvent({ status: EventStatus.REJECTED, clubId: null })),
    ).toBe(true);
  });
});

describe("canManageEvent", () => {
  it("lets admins manage any event", () => {
    expect(canManageEvent(adminScope, makeEvent({ clubId: RCY_CLUB_ID }))).toBe(true);
  });

  it("lets officers manage their own club's events", () => {
    expect(canManageEvent(litsOfficerScope, makeEvent())).toBe(true);
  });

  it("blocks officers from managing another club's events", () => {
    expect(canManageEvent(litsOfficerScope, makeEvent({ clubId: RCY_CLUB_ID }))).toBe(false);
  });

  it("blocks students even for their own club's events", () => {
    expect(canManageEvent(rcyStudentScope, makeEvent({ clubId: RCY_CLUB_ID }))).toBe(false);
  });
});
