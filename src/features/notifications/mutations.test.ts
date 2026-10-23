import { beforeEach, describe, expect, it, vi } from "vitest";

import { markAllNotificationsRead } from "./mutations";

const prismaMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  createMany: vi.fn(),
}));

vi.mock("@/lib/infra/prisma", () => ({
  prisma: {
    notification: { findMany: prismaMocks.findMany },
    notificationRead: { createMany: prismaMocks.createMany },
  },
}));

const scope = { userId: "user-1", clubId: "club-1", viewAll: false };

beforeEach(() => {
  prismaMocks.findMany.mockReset();
  prismaMocks.createMany.mockReset();
});

describe("markAllNotificationsRead", () => {
  it("marks every visible unread notification for the user", async () => {
    prismaMocks.findMany.mockResolvedValue([{ id: "n1" }, { id: "n2" }]);

    await markAllNotificationsRead(scope);

    expect(prismaMocks.createMany).toHaveBeenCalledWith({
      data: [
        { notificationId: "n1", userId: "user-1" },
        { notificationId: "n2", userId: "user-1" },
      ],
      skipDuplicates: true,
    });
  });

  it("skips the write when there is nothing unread", async () => {
    prismaMocks.findMany.mockResolvedValue([]);

    await markAllNotificationsRead(scope);

    expect(prismaMocks.createMany).not.toHaveBeenCalled();
  });
});
