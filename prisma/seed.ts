import "dotenv/config";

import { randomBytes } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import { LITS_CLUB_NAME, LITS_CLUB_SHORT_NAME } from "../src/features/clubs/constants";
import { NotificationAudience, Role } from "../src/generated/prisma/browser";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing required environment variable: DATABASE_URL. Check your .env file.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const LITS = LITS_CLUB_NAME;
const SSC = "Supreme Student Council";
const JPCS = "Junior Philippine Computer Society";
const RCY = "Red Cross Youth";

const ADMIN_EMAIL = "admin@acdeducation.com";
const DEV_EMAIL = "johnreyrabosa.f@gmail.com";
const LITS_OFFICER_EMAIL = "officer.lits@acdeducation.com";
const LITS_STUDENT_EMAIL = "student.lits@acdeducation.com";
const SSC_STUDENT_EMAIL = "student.ssc@acdeducation.com";
const JPCS_OFFICER_EMAIL = "officer.jpcs@acdeducation.com";
const RCY_STUDENT_EMAIL = "student.rcy@acdeducation.com";
const INACTIVE_STUDENT_EMAIL = "inactive.student@acdeducation.com";

function atDaysFromNow(
  days: number,
  hour: number,
  durationHours = 2,
): { startAt: Date; endAt: Date } {
  const startAt = new Date();
  startAt.setDate(startAt.getDate() + days);
  startAt.setHours(hour, 0, 0, 0);
  const endAt = new Date(startAt);
  endAt.setHours(startAt.getHours() + durationHours);
  return { startAt, endAt };
}

async function seedClubs() {
  const clubs = [
    { name: LITS, shortName: LITS_CLUB_SHORT_NAME },
    { name: SSC, shortName: "SSC" },
    { name: JPCS, shortName: "JPCS" },
    { name: RCY, shortName: "RCY" },
  ];

  const byName = new Map<string, { id: string }>();
  for (const club of clubs) {
    const row = await prisma.club.upsert({
      where: { name: club.name },
      update: { shortName: club.shortName },
      create: club,
    });
    byName.set(club.name, row);
    console.log(`Seeded club: ${club.name} (${club.shortName})`);
  }
  return byName;
}

async function seedUsers(clubByName: Map<string, { id: string }>) {
  const users = [
    {
      email: DEV_EMAIL,
      name: "John Rey Rabosa",
      role: Role.DEV,
      clubName: null,
      isActive: true,
    },
    {
      email: ADMIN_EMAIL,
      name: "Maria Santos",
      role: Role.ADMIN,
      clubName: null,
      isActive: true,
    },
    {
      email: LITS_OFFICER_EMAIL,
      name: "Liza Mercado",
      role: Role.OFFICER,
      clubName: LITS,
      isActive: true,
    },
    {
      email: LITS_STUDENT_EMAIL,
      name: "Carlo Reyes",
      role: Role.STUDENT,
      clubName: LITS,
      isActive: true,
    },
    {
      email: SSC_STUDENT_EMAIL,
      name: "Ana Dela Cruz",
      role: Role.STUDENT,
      clubName: SSC,
      isActive: true,
    },
    {
      email: JPCS_OFFICER_EMAIL,
      name: "Miguel Tan",
      role: Role.OFFICER,
      clubName: JPCS,
      isActive: true,
    },
    {
      email: RCY_STUDENT_EMAIL,
      name: "Grace Lim",
      role: Role.STUDENT,
      clubName: RCY,
      isActive: true,
    },
    {
      email: INACTIVE_STUDENT_EMAIL,
      name: "Paolo Garcia",
      role: Role.STUDENT,
      clubName: LITS,
      isActive: false,
    },
  ];

  const byEmail = new Map<string, { id: string }>();
  for (const user of users) {
    const clubId = user.clubName ? (clubByName.get(user.clubName)?.id ?? null) : null;
    const row = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, clubId, isActive: user.isActive },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        clubId,
        isActive: user.isActive,
        emailVerified: new Date(),
      },
    });
    byEmail.set(user.email, row);
    console.log(`Seeded user: ${user.email} (${user.role})`);
  }
  return byEmail;
}

async function seedEvents(
  clubByName: Map<string, { id: string }>,
  userByEmail: Map<string, { id: string }>,
) {
  const events = [
    {
      title: "LITS General Assembly 2026",
      description:
        "Kick-off assembly for the first semester. We will present the organization's plans, calendar of activities, and committee sign-ups.",
      venue: "AVR 1, Main Building",
      clubName: LITS,
      createdByEmail: LITS_OFFICER_EMAIL,
      ...atDaysFromNow(5, 13, 3),
    },
    {
      title: "Tech Talk: Introduction to Artificial Intelligence",
      description:
        "A beginner-friendly session on AI concepts, real-world applications, and career paths, followed by a Q&A with alumni.",
      venue: "Computer Laboratory 3",
      clubName: LITS,
      createdByEmail: LITS_OFFICER_EMAIL,
      ...atDaysFromNow(12, 9, 2),
    },
    {
      title: "Campus Clean-Up Drive",
      description:
        "Join the Supreme Student Council in keeping our campus clean. Cleaning materials and snacks will be provided.",
      venue: "Covered Court",
      clubName: SSC,
      createdByEmail: ADMIN_EMAIL,
      ...atDaysFromNow(8, 7, 4),
    },
    {
      title: "Coding Bootcamp: Web Development 101",
      description:
        "Hands-on workshop covering HTML, CSS, and JavaScript fundamentals. Bring your own laptop.",
      venue: "Computer Laboratory 1",
      clubName: JPCS,
      createdByEmail: JPCS_OFFICER_EMAIL,
      ...atDaysFromNow(15, 13, 4),
    },
    {
      title: "Blood Donation Drive",
      description:
        "Partnered with the local chapter of the Philippine Red Cross. Walk-ins are welcome; light meals will be served.",
      venue: "Gymnasium",
      clubName: RCY,
      createdByEmail: ADMIN_EMAIL,
      ...atDaysFromNow(21, 8, 6),
    },
  ];

  const byTitle = new Map<string, { id: string }>();
  for (const event of events) {
    const clubId = clubByName.get(event.clubName)?.id ?? null;
    const createdById = userByEmail.get(event.createdByEmail)?.id;
    if (!createdById) throw new Error(`Missing seeded user: ${event.createdByEmail}`);

    const data = {
      title: event.title,
      description: event.description,
      venue: event.venue,
      startAt: event.startAt,
      endAt: event.endAt,
      clubId,
      createdById,
    };

    const existing = await prisma.event.findFirst({ where: { title: event.title } });
    const row = existing
      ? await prisma.event.update({ where: { id: existing.id }, data })
      : await prisma.event.create({
          data: { ...data, publicToken: randomBytes(16).toString("hex") },
        });
    byTitle.set(event.title, row);
    console.log(`Seeded event: ${event.title}`);
  }
  return byTitle;
}

async function seedAttendances(
  eventByTitle: Map<string, { id: string }>,
  userByEmail: Map<string, { id: string }>,
) {
  const attendances = [
    { eventTitle: "LITS General Assembly 2026", studentEmail: LITS_STUDENT_EMAIL },
    { eventTitle: "LITS General Assembly 2026", studentEmail: SSC_STUDENT_EMAIL },
    {
      eventTitle: "Tech Talk: Introduction to Artificial Intelligence",
      studentEmail: LITS_STUDENT_EMAIL,
    },
    { eventTitle: "Campus Clean-Up Drive", studentEmail: SSC_STUDENT_EMAIL },
    { eventTitle: "Coding Bootcamp: Web Development 101", studentEmail: LITS_STUDENT_EMAIL },
    { eventTitle: "Blood Donation Drive", studentEmail: RCY_STUDENT_EMAIL },
  ];

  for (const attendance of attendances) {
    const eventId = eventByTitle.get(attendance.eventTitle)?.id;
    const studentId = userByEmail.get(attendance.studentEmail)?.id;
    if (!eventId || !studentId) continue;

    await prisma.attendance.upsert({
      where: { eventId_studentId: { eventId, studentId } },
      update: {},
      create: {
        eventId,
        studentId,
        photoUrl: `seed/attendance/${studentId}-${eventId}.jpg`,
      },
    });
    console.log(`Seeded attendance: ${attendance.studentEmail} @ ${attendance.eventTitle}`);
  }
}

async function seedNotifications(
  clubByName: Map<string, { id: string }>,
  userByEmail: Map<string, { id: string }>,
  eventByTitle: Map<string, { id: string }>,
) {
  const notifications = [
    {
      title: "Enrollment for the Second Semester is Now Open",
      body: "Enrollment runs until the end of the month. Settle any outstanding balances and confirm your schedule with your adviser before the deadline.",
      audience: NotificationAudience.ALL,
      clubName: null,
      eventTitle: null,
      createdByEmail: ADMIN_EMAIL,
    },
    {
      title: "Scheduled System Maintenance on Sunday",
      body: "The student portal will be unavailable from 12:00 AM to 4:00 AM for scheduled maintenance. We apologize for the inconvenience.",
      audience: NotificationAudience.ALL,
      clubName: null,
      eventTitle: null,
      createdByEmail: ADMIN_EMAIL,
    },
    {
      title: "LITS General Assembly this Friday",
      body: "All LITS members are required to attend the general assembly at AVR 1. Attendance will be checked at the door.",
      audience: NotificationAudience.CLUB,
      clubName: LITS,
      eventTitle: "LITS General Assembly 2026",
      createdByEmail: LITS_OFFICER_EMAIL,
    },
    {
      title: "Tech Talk RSVP Now Open",
      body: "Reserve your slot for the Introduction to Artificial Intelligence talk. Limited seats available on a first-come, first-served basis.",
      audience: NotificationAudience.CLUB,
      clubName: LITS,
      eventTitle: "Tech Talk: Introduction to Artificial Intelligence",
      createdByEmail: LITS_OFFICER_EMAIL,
    },
    {
      title: "Volunteers Needed for the Campus Clean-Up Drive",
      body: "The Supreme Student Council is looking for volunteers. Sign up at the SSC office to secure a slot and claim your certificate.",
      audience: NotificationAudience.CLUB,
      clubName: SSC,
      eventTitle: "Campus Clean-Up Drive",
      createdByEmail: ADMIN_EMAIL,
    },
    {
      title: "Coding Bootcamp Slots Still Available",
      body: "A few slots remain for the Web Development 101 bootcamp. Bring your own laptop and make sure your development tools are installed.",
      audience: NotificationAudience.CLUB,
      clubName: JPCS,
      eventTitle: "Coding Bootcamp: Web Development 101",
      createdByEmail: JPCS_OFFICER_EMAIL,
    },
    {
      title: "Blood Donation Drive this Month",
      body: "Donate blood and help save lives. Donors must be at least 18 years old, weigh at least 50 kg, and be in good health.",
      audience: NotificationAudience.CLUB,
      clubName: RCY,
      eventTitle: "Blood Donation Drive",
      createdByEmail: ADMIN_EMAIL,
    },
  ];

  const byTitle = new Map<string, { id: string }>();
  for (const notification of notifications) {
    const clubId = notification.clubName
      ? (clubByName.get(notification.clubName)?.id ?? null)
      : null;
    const createdById = userByEmail.get(notification.createdByEmail)?.id;
    const eventId = notification.eventTitle
      ? (eventByTitle.get(notification.eventTitle)?.id ?? null)
      : null;
    if (!createdById) throw new Error(`Missing seeded user: ${notification.createdByEmail}`);

    const existing = await prisma.notification.findFirst({
      where: { title: notification.title },
    });
    const row = existing
      ? existing
      : await prisma.notification.create({
          data: {
            title: notification.title,
            body: notification.body,
            audience: notification.audience,
            clubId,
            eventId,
            createdById,
          },
        });
    byTitle.set(notification.title, row);
    console.log(`Seeded notification: ${notification.title}`);
  }
  return byTitle;
}

async function seedNotificationReads(
  notificationByTitle: Map<string, { id: string }>,
  userByEmail: Map<string, { id: string }>,
) {
  const reads = [
    {
      notificationTitle: "Enrollment for the Second Semester is Now Open",
      userEmail: LITS_STUDENT_EMAIL,
    },
    { notificationTitle: "LITS General Assembly this Friday", userEmail: LITS_STUDENT_EMAIL },
    { notificationTitle: "Tech Talk RSVP Now Open", userEmail: LITS_STUDENT_EMAIL },
    {
      notificationTitle: "Enrollment for the Second Semester is Now Open",
      userEmail: SSC_STUDENT_EMAIL,
    },
  ];

  for (const read of reads) {
    const notificationId = notificationByTitle.get(read.notificationTitle)?.id;
    const userId = userByEmail.get(read.userEmail)?.id;
    if (!notificationId || !userId) continue;

    await prisma.notificationRead.upsert({
      where: { notificationId_userId: { notificationId, userId } },
      update: {},
      create: { notificationId, userId },
    });
  }
  console.log("Seeded notification reads");
}

async function seedPendingAssignment(
  clubByName: Map<string, { id: string }>,
  assignedById: string,
) {
  const pending = {
    email: "new.officer.lits@acdeducation.com",
    role: Role.OFFICER,
    clubId: clubByName.get(LITS)?.id ?? null,
  };

  await prisma.pendingRoleAssignment.upsert({
    where: { email: pending.email },
    update: { role: pending.role, clubId: pending.clubId },
    create: { ...pending, assignedById },
  });
  console.log(`Seeded pending role assignment: ${pending.email}`);
}

async function main() {
  const clubByName = await seedClubs();
  const userByEmail = await seedUsers(clubByName);
  const eventByTitle = await seedEvents(clubByName, userByEmail);
  await seedAttendances(eventByTitle, userByEmail);
  const notificationByTitle = await seedNotifications(clubByName, userByEmail, eventByTitle);
  await seedNotificationReads(notificationByTitle, userByEmail);
  const dev = userByEmail.get(DEV_EMAIL);
  if (!dev) throw new Error(`Missing seeded user: ${DEV_EMAIL}`);
  await seedPendingAssignment(clubByName, dev.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
