/**
 * Demo seed: one user per login role, plus a club, an event, one attendance
 * record and one notice. Idempotent, so it can be re-run safely.
 *
 * Run with `pnpm prisma:seed` (against `DATABASE_URL`). Refuses to run in
 * production, and against a non-local host unless `ALLOW_SEED=true`.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { Role } from "@/generated/prisma/browser";
import { PrismaClient } from "@/generated/prisma/client";
import { DEMO_ACCOUNTS } from "@/lib/infra/demo-accounts";
import { getEnvBoolean } from "@/lib/infra/env";
import { assertSeedAllowed } from "@/lib/infra/seed-guard";

config();

assertSeedAllowed({
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL ?? "",
  allowSeed: getEnvBoolean("ALLOW_SEED"),
});

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" }),
});

async function main() {
  const club = await prisma.club.upsert({
    where: { name: "Computer Science Society" },
    update: {},
    create: { name: "Computer Science Society" },
  });

  const seeded = new Map<Role, string>();
  const seededEmails: string[] = [];
  for (const user of DEMO_ACCOUNTS) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, isActive: true, clubId: club.id },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        clubId: club.id,
        emailVerified: new Date(),
      },
    });
    seeded.set(record.role, record.id);
    seededEmails.push(record.email);
  }

  const studentId = seeded.get(Role.STUDENT);
  const officerId = seeded.get(Role.OFFICER);
  const adminId = seeded.get(Role.ADMIN);
  if (!studentId || !officerId || !adminId) {
    throw new Error("Seed needs a STUDENT, an OFFICER and an ADMIN demo account.");
  }

  const startAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const event = await prisma.event.upsert({
    where: { id: "seed-event-open-day" },
    update: {},
    create: {
      id: "seed-event-open-day",
      title: "Open Day orientation",
      description: "Seeded demo event.",
      venue: "Main Auditorium",
      startAt,
      endAt: new Date(startAt.getTime() + 2 * 60 * 60 * 1000),
      clubId: club.id,
      createdById: adminId,
    },
  });

  await prisma.attendance.upsert({
    where: { eventId_studentId: { eventId: event.id, studentId } },
    update: {},
    create: { eventId: event.id, studentId, photoUrl: "/school-logo.svg" },
  });

  const notification = await prisma.notification.upsert({
    where: { id: "seed-notice-welcome" },
    update: {},
    create: {
      id: "seed-notice-welcome",
      title: "Welcome to the event system",
      body: "This notice was created by the seed script.",
      audience: "ALL",
      createdById: officerId,
    },
  });

  await prisma.notificationRead.upsert({
    where: {
      notificationId_userId: { notificationId: notification.id, userId: studentId },
    },
    update: {},
    create: { notificationId: notification.id, userId: studentId },
  });

  console.log("Seeded users (sign in as any of these):");
  for (const user of DEMO_ACCOUNTS) console.log(`  ${user.role.padEnd(9)} ${user.email}`);
  console.log(`Seeded event: ${event.title} (${event.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
