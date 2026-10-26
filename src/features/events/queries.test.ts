import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EventApprovalAction,
  EventStatus,
  RegistrationStatus,
  TaskStatus,
} from "@/generated/prisma/browser";

import {
  countSubmittedEvents,
  getApprovalQueue,
  getEventById,
  getEventDetail,
  getEventForEdit,
  getEventPage,
  getPublishedEventById,
  getPublishedEvents,
  getRegistrationTicket,
  getStudentRegistrations,
} from "./queries";

const prismaMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  registrationFindMany: vi.fn(),
  registrationFindUnique: vi.fn(),
}));

vi.mock("@/lib/infra/prisma", () => ({
  prisma: {
    event: {
      findUnique: prismaMocks.findUnique,
      findFirst: prismaMocks.findFirst,
      findMany: prismaMocks.findMany,
      count: prismaMocks.count,
    },
    registration: {
      findMany: prismaMocks.registrationFindMany,
      findUnique: prismaMocks.registrationFindUnique,
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
  prismaMocks.findFirst.mockReset();
  prismaMocks.findMany.mockReset();
  prismaMocks.count.mockReset();
  prismaMocks.registrationFindMany.mockReset();
  prismaMocks.registrationFindUnique.mockReset();
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

const submittedAt = new Date("2026-10-25T09:00:00+08:00");
const createdAt = new Date("2026-10-20T09:00:00+08:00");

describe("getApprovalQueue", () => {
  it("returns submitted events with their latest submission actor", async () => {
    prismaMocks.findMany.mockResolvedValue([
      {
        id: "event-1",
        title: "Annual Science Fair 2026",
        description: "A showcase of student research.",
        venue: "Main Gymnasium",
        startAt,
        endAt,
        mechanics: "Register at the booth.",
        programFlow: "Opening remarks, judging, awards.",
        requirements: "Bring a student ID.",
        createdAt,
        createdBy: { name: "Liza Mercado" },
        approvals: [{ createdAt: submittedAt, actor: { name: "Maria Santos" } }],
      },
    ]);

    await expect(getApprovalQueue()).resolves.toEqual([
      {
        id: "event-1",
        title: "Annual Science Fair 2026",
        description: "A showcase of student research.",
        venue: "Main Gymnasium",
        startAt,
        endAt,
        mechanics: "Register at the booth.",
        programFlow: "Opening remarks, judging, awards.",
        requirements: "Bring a student ID.",
        createdByName: "Liza Mercado",
        submittedByName: "Maria Santos",
        submittedAt,
      },
    ]);

    expect(prismaMocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: EventStatus.SUBMITTED },
        orderBy: [{ startAt: "asc" }, { id: "asc" }],
      }),
    );
    expect(prismaMocks.findMany.mock.calls[0]?.[0]?.select?.approvals).toEqual({
      where: { action: EventApprovalAction.SUBMITTED },
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { createdAt: true, actor: { select: { name: true } } },
    });
  });

  it("falls back to the creator and creation time for a legacy submission", async () => {
    prismaMocks.findMany.mockResolvedValue([
      {
        id: "event-1",
        title: "Annual Science Fair 2026",
        description: null,
        venue: "Main Gymnasium",
        startAt,
        endAt: null,
        mechanics: null,
        programFlow: null,
        requirements: null,
        createdAt,
        createdBy: { name: "Liza Mercado" },
        approvals: [],
      },
    ]);

    const [row] = await getApprovalQueue();

    expect(row).toEqual(
      expect.objectContaining({
        submittedByName: null,
        submittedAt: createdAt,
        createdByName: "Liza Mercado",
      }),
    );
  });
});

describe("countSubmittedEvents", () => {
  it("counts only submitted events", async () => {
    prismaMocks.count.mockResolvedValue(3);

    await expect(countSubmittedEvents()).resolves.toBe(3);

    expect(prismaMocks.count).toHaveBeenCalledWith({
      where: { status: EventStatus.SUBMITTED },
    });
  });
});

const now = new Date("2026-10-26T00:00:00+08:00");
const publishedAt = new Date("2026-10-20T09:00:00+08:00");

const publishedEventRow = {
  id: "event-1",
  title: "Annual Science Fair 2026",
  description: "A showcase of student research.",
  venue: "Main Gymnasium",
  startAt,
  endAt,
  capacity: 100,
  registrationClosesAt: null,
  publishedAt,
  createdAt,
  status: EventStatus.PUBLISHED,
  createdBy: { name: "KASAMA" },
  _count: { registrations: 10 },
};

const expectedPublishedEvent = {
  id: "event-1",
  title: "Annual Science Fair 2026",
  organizer: "KASAMA",
  description: "A showcase of student research.",
  venue: "Main Gymnasium",
  startAt: startAt.toISOString(),
  endAt: endAt.toISOString(),
  registrationOpensAt: publishedAt.toISOString(),
  registrationClosesAt: startAt.toISOString(),
  capacity: 100,
  seatsTaken: 10,
  registration: null,
  status: "open",
  remainingSeats: 90,
  canCancel: false,
};

describe("getEventPage", () => {
  it("returns mapped rows and a next cursor when there is more", async () => {
    prismaMocks.findMany.mockResolvedValue([
      {
        id: "event-1",
        title: "Annual Science Fair 2026",
        venue: "Main Gymnasium",
        startAt,
        endAt,
        status: EventStatus.PUBLISHED,
        capacity: 100,
        _count: { registrations: 12 },
      },
      {
        id: "event-2",
        title: "Debate Finals",
        venue: "Auditorium",
        startAt,
        endAt: null,
        status: EventStatus.DRAFT,
        capacity: null,
        _count: { registrations: 0 },
      },
    ]);

    const page = await getEventPage({ pageSize: 1 });

    expect(page.rows).toEqual([
      {
        id: "event-1",
        title: "Annual Science Fair 2026",
        venue: "Main Gymnasium",
        startAt,
        endAt,
        status: EventStatus.PUBLISHED,
        capacity: 100,
        registeredCount: 12,
      },
    ]);
    expect(page.nextCursor).toEqual(expect.any(String));
  });

  it("filters by status and search", async () => {
    prismaMocks.findMany.mockResolvedValue([]);

    await getEventPage({
      search: "  science  ",
      status: [EventStatus.DRAFT, EventStatus.REVISION_REQUESTED],
    });

    expect(prismaMocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: [EventStatus.DRAFT, EventStatus.REVISION_REQUESTED] },
          OR: [
            { title: { contains: "science", mode: "insensitive" } },
            { venue: { contains: "science", mode: "insensitive" } },
          ],
        },
      }),
    );
  });
});

describe("getEventDetail", () => {
  it("returns the event with counts, scanners, and the approval trail", async () => {
    prismaMocks.findUnique.mockResolvedValue({
      ...publishedEventRow,
      mechanics: "Doors open at 7:30 AM.",
      programFlow: "Opening remarks, exhibits, closing.",
      requirements: "Bring your student ID.",
      createdBy: { name: "Liza Mercado", email: "liza@acdeducation.com" },
      tasks: [
        {
          id: "task-1",
          status: TaskStatus.ASSIGNED,
          assignee: { name: "Maria Santos", email: "maria@acdeducation.com" },
        },
      ],
      approvals: [
        {
          id: "approval-1",
          action: EventApprovalAction.APPROVED,
          fromStatus: EventStatus.SUBMITTED,
          toStatus: EventStatus.PUBLISHED,
          comment: null,
          createdAt: publishedAt,
          actor: { name: "Admin" },
        },
      ],
    });

    const detail = await getEventDetail("event-1");

    expect(detail).toEqual({
      id: "event-1",
      title: "Annual Science Fair 2026",
      description: "A showcase of student research.",
      venue: "Main Gymnasium",
      startAt,
      endAt,
      status: EventStatus.PUBLISHED,
      mechanics: "Doors open at 7:30 AM.",
      programFlow: "Opening remarks, exhibits, closing.",
      requirements: "Bring your student ID.",
      capacity: 100,
      registrationClosesAt: null,
      publishedAt,
      createdAt,
      createdByName: "Liza Mercado",
      createdByEmail: "liza@acdeducation.com",
      registeredCount: 10,
      scanners: [
        {
          id: "task-1",
          status: TaskStatus.ASSIGNED,
          assigneeName: "Maria Santos",
          assigneeEmail: "maria@acdeducation.com",
        },
      ],
      approvals: [
        {
          id: "approval-1",
          action: EventApprovalAction.APPROVED,
          fromStatus: EventStatus.SUBMITTED,
          toStatus: EventStatus.PUBLISHED,
          comment: null,
          createdAt: publishedAt,
          actorName: "Admin",
        },
      ],
    });
  });

  it("returns null when the event does not exist", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);

    await expect(getEventDetail("missing")).resolves.toBeNull();
  });
});

describe("getEventForEdit", () => {
  it("returns an editable event", async () => {
    prismaMocks.findFirst.mockResolvedValue({
      id: "event-1",
      title: "Annual Science Fair 2026",
      description: null,
      venue: "Main Gymnasium",
      startAt,
      endAt,
      mechanics: null,
      programFlow: null,
      requirements: null,
      capacity: null,
      registrationClosesAt: null,
      status: EventStatus.REVISION_REQUESTED,
    });

    await expect(getEventForEdit("event-1")).resolves.toEqual(
      expect.objectContaining({ id: "event-1", status: EventStatus.REVISION_REQUESTED }),
    );
    expect(prismaMocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "event-1",
          status: { in: [EventStatus.DRAFT, EventStatus.REVISION_REQUESTED] },
        },
      }),
    );
  });

  it("returns null for a non-editable event", async () => {
    prismaMocks.findFirst.mockResolvedValue(null);

    await expect(getEventForEdit("event-1")).resolves.toBeNull();
  });
});

describe("getPublishedEvents", () => {
  it("maps the event and the student's registration", async () => {
    prismaMocks.findMany.mockResolvedValue([publishedEventRow]);
    prismaMocks.registrationFindMany.mockResolvedValue([
      {
        eventId: "event-1",
        reference: "KASAMA-ABC123",
        status: RegistrationStatus.REGISTERED,
      },
    ]);

    const [event] = await getPublishedEvents({ studentId: "student-1", now });

    expect(event).toEqual({
      ...expectedPublishedEvent,
      registration: { reference: "KASAMA-ABC123", state: "registered" },
      status: "registered",
      canCancel: true,
    });
  });

  it("treats a null capacity as unlimited and a closed deadline as closed", async () => {
    prismaMocks.findMany.mockResolvedValue([
      {
        ...publishedEventRow,
        capacity: null,
        registrationClosesAt: new Date("2026-10-25T00:00:00+08:00"),
        _count: { registrations: 5 },
      },
    ]);
    prismaMocks.registrationFindMany.mockResolvedValue([]);

    const [event] = await getPublishedEvents({ now });

    expect(event).toEqual(
      expect.objectContaining({
        capacity: null,
        seatsTaken: 5,
        remainingSeats: null,
        status: "closed",
        registration: null,
      }),
    );
  });

  it("marks an event full when registered seats reach capacity", async () => {
    prismaMocks.findMany.mockResolvedValue([
      { ...publishedEventRow, capacity: 10, _count: { registrations: 10 } },
    ]);
    prismaMocks.registrationFindMany.mockResolvedValue([]);

    const [event] = await getPublishedEvents({ now });

    expect(event).toEqual(expect.objectContaining({ remainingSeats: 0, status: "full" }));
  });
});

describe("getPublishedEventById", () => {
  it("returns one published event with the student's registration", async () => {
    prismaMocks.findFirst.mockResolvedValue(publishedEventRow);
    prismaMocks.registrationFindUnique.mockResolvedValue({
      reference: "KASAMA-ABC123",
      status: RegistrationStatus.REGISTERED,
    });

    await expect(
      getPublishedEventById("event-1", { studentId: "student-1", now }),
    ).resolves.toEqual({
      ...expectedPublishedEvent,
      registration: { reference: "KASAMA-ABC123", state: "registered" },
      status: "registered",
      canCancel: true,
    });
  });

  it("returns null when the event is not published", async () => {
    prismaMocks.findFirst.mockResolvedValue(null);

    await expect(getPublishedEventById("event-1")).resolves.toBeNull();
  });
});

describe("getStudentRegistrations", () => {
  it("maps cancelled registrations and cancelled events to the cancelled tab state", async () => {
    prismaMocks.registrationFindMany.mockResolvedValue([
      {
        reference: "KASAMA-ABC123",
        status: RegistrationStatus.REGISTERED,
        event: { ...publishedEventRow, status: EventStatus.CANCELLED },
      },
    ]);

    const [event] = await getStudentRegistrations("student-1", now);

    expect(event).toEqual(
      expect.objectContaining({
        id: "event-1",
        registration: { reference: "KASAMA-ABC123", state: "cancelled" },
        canCancel: false,
      }),
    );
  });
});

describe("getRegistrationTicket", () => {
  it("returns the event and active registration", async () => {
    prismaMocks.registrationFindUnique.mockResolvedValue({
      reference: "KASAMA-ABC123",
      status: RegistrationStatus.REGISTERED,
      event: publishedEventRow,
    });

    await expect(getRegistrationTicket("event-1", "student-1", now)).resolves.toEqual({
      event: {
        ...expectedPublishedEvent,
        registration: { reference: "KASAMA-ABC123", state: "registered" },
        status: "registered",
        canCancel: true,
      },
      registration: { reference: "KASAMA-ABC123", state: "registered" },
    });
  });

  it("returns null for a cancelled registration", async () => {
    prismaMocks.registrationFindUnique.mockResolvedValue({
      reference: "KASAMA-ABC123",
      status: RegistrationStatus.CANCELLED,
      event: publishedEventRow,
    });

    await expect(getRegistrationTicket("event-1", "student-1", now)).resolves.toBeNull();
  });
});
