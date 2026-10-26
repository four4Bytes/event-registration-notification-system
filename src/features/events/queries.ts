import { EventStatus } from "@/generated/prisma/browser";
import { Prisma } from "@/generated/prisma/client";
import {
  decodeTimestampCursor,
  encodeTimestampCursor,
  resolveCursorPageSize,
  type CursorPage,
  type TimestampCursor,
} from "@/lib/domain/pagination";
import { prisma } from "@/lib/infra/prisma";

import type { EventScope } from "./scope";

/** Row shape rendered by the events table. */
export interface EventRow {
  id: string;
  title: string;
  venue: string;
  startAt: Date;
  endAt: Date | null;
  status: EventStatus;
  clubName: string | null;
  clubShortName: string | null;
}

/** Cursor page of events. */
export type EventPage = CursorPage<EventRow>;

/** Full event projection used by the detail and QR pages. */
export interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  startAt: Date;
  endAt: Date | null;
  facebookUrl: string | null;
  status: EventStatus;
  publicToken: string;
  clubId: string | null;
  clubName: string | null;
  clubShortName: string | null;
  createdById: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Parameters for {@link getEventPage}. */
export interface EventPageParams {
  scope: EventScope;
  query: EventPageQuery;
}

/** Validated list parameters for {@link getEventPage}. */
export interface EventPageQuery {
  search?: string;
  cursor?: string;
  pageSize?: number;
  sort?: { column: string; direction: "asc" | "desc" };
  filters?: { status?: EventStatus[] };
}

const eventDetailSelect = {
  id: true,
  title: true,
  description: true,
  venue: true,
  startAt: true,
  endAt: true,
  facebookUrl: true,
  status: true,
  publicToken: true,
  clubId: true,
  club: { select: { name: true, shortName: true } },
  createdById: true,
  createdBy: { select: { name: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.EventSelect;

function buildVisibilityFilter(scope: EventScope): Prisma.EventWhereInput {
  if (scope.viewAll) return {};
  return {
    AND: [
      {
        OR: [{ clubId: null }, ...(scope.clubId ? [{ clubId: scope.clubId }] : [])],
      },
      {
        OR: [{ status: EventStatus.APPROVED }, { createdById: scope.userId }],
      },
    ],
  };
}

function buildSearchFilter(search: string): Prisma.EventWhereInput {
  return search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { venue: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
}

function buildStatusFilter(statuses: EventStatus[] | undefined): Prisma.EventWhereInput {
  if (!statuses || statuses.length === 0) return {};
  return { status: { in: statuses } };
}

function buildCursorFilter(cursor: TimestampCursor | null, ascending: boolean) {
  if (!cursor) return {};
  const { timestamp, id } = cursor;
  return {
    OR: ascending
      ? [{ startAt: { gt: timestamp } }, { startAt: timestamp, id: { gt: id } }]
      : [{ startAt: { lt: timestamp } }, { startAt: timestamp, id: { lt: id } }],
  } satisfies Prisma.EventWhereInput;
}

function toEventRow(row: {
  id: string;
  title: string;
  venue: string;
  startAt: Date;
  endAt: Date | null;
  status: EventStatus;
  club: { name: string; shortName: string | null } | null;
}): EventRow {
  return {
    id: row.id,
    title: row.title,
    venue: row.venue,
    startAt: row.startAt,
    endAt: row.endAt,
    status: row.status,
    clubName: row.club?.name ?? null,
    clubShortName: row.club?.shortName ?? null,
  };
}

function toEventDetail(
  row: Prisma.EventGetPayload<{ select: typeof eventDetailSelect }>,
): EventDetail {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    venue: row.venue,
    startAt: row.startAt,
    endAt: row.endAt,
    facebookUrl: row.facebookUrl,
    status: row.status,
    publicToken: row.publicToken,
    clubId: row.clubId,
    clubName: row.club?.name ?? null,
    clubShortName: row.club?.shortName ?? null,
    createdById: row.createdById,
    createdByName: row.createdBy.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Reads a cursor page of events visible to the caller.
 *
 * @param params - The caller's scope plus search, sort, filter, and cursor parameters.
 * @returns A page of event rows ordered by start time.
 */
export async function getEventPage({ scope, query }: EventPageParams): Promise<EventPage> {
  const pageSize = resolveCursorPageSize(query.pageSize);
  const search = query.search?.trim() ?? "";
  const ascending = query.sort?.column !== "startAt" || query.sort.direction !== "desc";
  const direction = ascending ? "asc" : "desc";
  const cursor = decodeTimestampCursor(query.cursor);

  const rows = await prisma.event.findMany({
    where: {
      AND: [
        buildVisibilityFilter(scope),
        buildStatusFilter(query.filters?.status),
        buildSearchFilter(search),
        buildCursorFilter(cursor, ascending),
      ],
    },
    orderBy: [{ startAt: direction }, { id: direction }],
    take: pageSize + 1,
    select: {
      id: true,
      title: true,
      venue: true,
      startAt: true,
      endAt: true,
      status: true,
      club: { select: { name: true, shortName: true } },
    },
  });

  const hasMore = rows.length > pageSize;
  const page = hasMore ? rows.slice(0, pageSize) : rows;
  const last = page.at(-1);

  return {
    rows: page.map(toEventRow),
    nextCursor:
      hasMore && last ? encodeTimestampCursor({ timestamp: last.startAt, id: last.id }) : null,
  };
}

/**
 * Reads one event by id.
 *
 * @param eventId - The event's cuid.
 * @returns The full event projection, or `null` when it no longer exists.
 */
export async function getEventById(eventId: string): Promise<EventDetail | null> {
  const row = await prisma.event.findUnique({ where: { id: eventId }, select: eventDetailSelect });
  return row ? toEventDetail(row) : null;
}

/**
 * Reads one event by its QR token.
 *
 * @param publicToken - The 32-character hex token encoded in the QR code.
 * @returns The full event projection, or `null` when the token is unknown.
 */
export async function getEventByPublicToken(publicToken: string): Promise<EventDetail | null> {
  const row = await prisma.event.findUnique({
    where: { publicToken },
    select: eventDetailSelect,
  });
  return row ? toEventDetail(row) : null;
}
