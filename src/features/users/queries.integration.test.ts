import { beforeAll, describe, expect, it } from "vitest";

import { getDevSignInAccounts } from "@/features/users/queries";
import { prisma } from "@/lib/infra/prisma";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "NotificationRead", "Notification", "Attendance", "Event", "Club", "PendingRoleAssignment", "Session", "Account", "User", "VerificationToken" RESTART IDENTITY CASCADE',
  );
}

describe("getDevSignInAccounts", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it("returns only the accounts the demo seed creates, without extra fields", async () => {
    await prisma.user.create({
      data: { email: "student@acdeducation.com", name: "Sam Student", role: "STUDENT" },
    });
    await prisma.user.create({
      data: { email: "someone.else@acdeducation.com", name: "Someone Else", role: "ADMIN" },
    });

    await expect(getDevSignInAccounts()).resolves.toEqual([
      { email: "student@acdeducation.com", role: "STUDENT" },
    ]);
  });
});
