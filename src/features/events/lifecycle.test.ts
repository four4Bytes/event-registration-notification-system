import { describe, expect, it } from "vitest";

import { canRegister, canTransition } from "@/features/events/lifecycle";
import { EventStatus } from "@/generated/prisma/browser";

const statuses = Object.values(EventStatus);

const allowed: Array<[EventStatus, EventStatus]> = [
  [EventStatus.DRAFT, EventStatus.PENDING_APPROVAL],
  [EventStatus.PENDING_APPROVAL, EventStatus.APPROVED],
  [EventStatus.PENDING_APPROVAL, EventStatus.REVISION_REQUESTED],
  [EventStatus.PENDING_APPROVAL, EventStatus.REJECTED],
  [EventStatus.REVISION_REQUESTED, EventStatus.PENDING_APPROVAL],
  [EventStatus.APPROVED, EventStatus.PUBLISHED],
  [EventStatus.DRAFT, EventStatus.CANCELLED],
  [EventStatus.PENDING_APPROVAL, EventStatus.CANCELLED],
  [EventStatus.APPROVED, EventStatus.CANCELLED],
  [EventStatus.PUBLISHED, EventStatus.CANCELLED],
];

const refused: Array<[EventStatus, EventStatus]> = [
  [EventStatus.DRAFT, EventStatus.APPROVED],
  [EventStatus.DRAFT, EventStatus.REJECTED],
  [EventStatus.DRAFT, EventStatus.REVISION_REQUESTED],
  [EventStatus.PENDING_APPROVAL, EventStatus.DRAFT],
  [EventStatus.REVISION_REQUESTED, EventStatus.APPROVED],
  [EventStatus.REVISION_REQUESTED, EventStatus.REJECTED],
  [EventStatus.APPROVED, EventStatus.DRAFT],
  [EventStatus.APPROVED, EventStatus.PENDING_APPROVAL],
  [EventStatus.PUBLISHED, EventStatus.DRAFT],
  [EventStatus.PUBLISHED, EventStatus.APPROVED],
  [EventStatus.PUBLISHED, EventStatus.REJECTED],
  [EventStatus.REJECTED, EventStatus.PENDING_APPROVAL],
  [EventStatus.REJECTED, EventStatus.APPROVED],
  [EventStatus.REJECTED, EventStatus.PUBLISHED],
  [EventStatus.CANCELLED, EventStatus.DRAFT],
  [EventStatus.CANCELLED, EventStatus.PUBLISHED],
];

describe("canTransition", () => {
  it.each(allowed)("allows %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each(refused)("refuses %s → %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it("refuses every state moving to itself", () => {
    for (const status of statuses) expect(canTransition(status, status)).toBe(false);
  });

  it("leaves REJECTED and CANCELLED with no way out", () => {
    for (const status of statuses) {
      expect(canTransition(EventStatus.REJECTED, status)).toBe(false);
      expect(canTransition(EventStatus.CANCELLED, status)).toBe(false);
    }
  });
});

describe("canRegister", () => {
  it("accepts a published event and no other state", () => {
    const open = statuses.filter((status) => canRegister({ status }));

    expect(open).toEqual([EventStatus.PUBLISHED]);
  });
});
