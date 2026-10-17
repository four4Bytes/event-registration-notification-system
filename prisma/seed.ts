/**
 * Demo seed: one user per login role, plus a club, an event, one attendance
 * record and one notice. Idempotent, so it can be re-run safely.
 *
 * Run with `pnpm prisma:seed` (against `DATABASE_URL`). Refuses to run in
 * production, and against a non-local host unless `ALLOW_SEED=true`.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { PrismaClient } from "@/generated/prisma/client";
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

const users = [
  { email: "student@acdeducation.com", name: "Sam Student", role: "STUDENT" as const },
  { email: "officer@acdeducation.com", name: "Olive Officer", role: "OFFICER" as const },
  { email: "admin@acdeducation.com", name: "Ada Admin", role: "ADMIN" as const },
  { email: "approver@acdeducation.com", name: "Pat Approver", role: "APPROVER" as const },
  {
    email: process.env.DEV_EMAIL ?? "dev@acdeducation.com",
    name: "Dev Support",
    role: "DEV" as const,
  },
];

async function main() {
  const club = await prisma.club.upsert({
    where: { name: "Computer Science Society" },
    update: {},
    create: { name: "Computer Science Society" },
  });

  const seeded = [];
  for (const user of users) {
    seeded.push(
      await prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name, role: user.role, isActive: true, clubId: club.id },
        create: {
          email: user.email,
          name: user.name,
          role: user.role,
          clubId: club.id,
          emailVerified: new Date(),
        },
      }),
    );
  }

  const [student, officer, admin] = seeded;
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
      createdById: admin.id,
    },
  });

  await prisma.attendance.upsert({
    where: { eventId_studentId: { eventId: event.id, studentId: student.id } },
    update: {},
    create: { eventId: event.id, studentId: student.id, photoUrl: "/school-logo.svg" },
  });

  const notification = await prisma.notification.upsert({
    where: { id: "seed-notice-welcome" },
    update: {},
    create: {
      id: "seed-notice-welcome",
      title: "Welcome to the event system",
      body: "This notice was created by the seed script.",
      audience: "ALL",
      createdById: officer.id,
    },
  });

  await prisma.notificationRead.upsert({
    where: {
      notificationId_userId: { notificationId: notification.id, userId: student.id },
    },
    update: {},
    create: { notificationId: notification.id, userId: student.id },
  });

  console.log("Seeded users (sign in as any of these):");
  for (const user of seeded) console.log(`  ${user.role.padEnd(9)} ${user.email}`);
  console.log(`Seeded event: ${event.title} (${event.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
