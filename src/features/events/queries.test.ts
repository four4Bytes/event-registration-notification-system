import { beforeEach, describe, expect, it, vi } from "vitest";

import { getEventById } from "./queries";

const prismaMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
}));

vi.mock("@/lib/infra/prisma", () => ({
  prisma: {
    event: {
      findUnique: prismaMocks.findUnique,
    },
  },
}));

const startAt = new Date("2026-11-12T08:00:00+08:00");
const endAt = new Date("2026-11-12T16:00:00+08:00");

const eventRow = {
  id: "event-1",
  title: "Annual Science Fair 2026",
  description: "A showcase of student research.",
  venue: "Main Gymnasium",
  startAt,
  endAt,
  createdBy: { name: "Liza Mercado" },
};

const expectedEvent = {
  id: "event-1",
  title: "Annual Science Fair 2026",
  description: "A showcase of student research.",
  venue: "Main Gymnasium",
  startAt,
  endAt,
  organizer: "Liza Mercado",
};

beforeEach(() => {
  prismaMocks.findUnique.mockReset();
});

describe("getEventById", () => {
  it("returns the event with its creator as the organizer", async () => {
    prismaMocks.findUnique.mockResolvedValue(eventRow);

    await expect(getEventById("event-1")).resolves.toEqual(expectedEvent);
  });

  it("returns null when the event does not exist", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);

    await expect(getEventById("missing")).resolves.toBeNull();
  });
});
