import { NotificationAudience } from "@/generated/prisma/browser";
import { Prisma } from "@/generated/prisma/client";
import {
  decodeTimestampCursor,
  encodeTimestampCursor,
  resolveCursorPageSize,
  type CursorPage,
  type TimestampCursor,
} from "@/lib/domain/pagination";
import { prisma } from "@/lib/infra/prisma";
import type { PageQuery } from "@/lib/primitives/types";

import type { NotificationScope } from "./scope";

export interface NotificationRow {
  id: string;
  title: string;
  body: string;
  audience: NotificationAudience;
  clubName: string | null;
  clubShortName: string | null;
  createdAt: Date;
  isRead: boolean;
}

export type NotificationPage = CursorPage<NotificationRow>;

export interface NotificationPageParams {
  scope: NotificationScope;
  query: PageQuery;
}

function buildAudienceFilter(scope: NotificationScope): Prisma.NotificationWhereInput {
  if (scope.viewAll) return {};
  return {
    OR: [
      { audience: NotificationAudience.ALL },
      ...(scope.clubId ? [{ audience: NotificationAudience.CLUB, clubId: scope.clubId }] : []),
    ],
  };
}

function buildSearchFilter(search: string): Prisma.NotificationWhereInput {
  return search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { body: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
}

function buildReadStatusFilter(
  statuses: string[] | undefined,
  userId: string,
): Prisma.NotificationWhereInput {
  if (!statuses || statuses.length !== 1) return {};
  return statuses[0] === "unread"
    ? { reads: { none: { userId } } }
    : { reads: { some: { userId } } };
}

function buildCursorFilter(cursor: TimestampCursor | null, ascending: boolean) {
  if (!cursor) return {};
  const { timestamp, id } = cursor;
  return {
    OR: ascending
      ? [{ createdAt: { gt: timestamp } }, { createdAt: timestamp, id: { gt: id } }]
      : [{ createdAt: { lt: timestamp } }, { createdAt: timestamp, id: { lt: id } }],
  } satisfies Prisma.NotificationWhereInput;
}

export async function getNotificationPage({
  scope,
  query,
}: NotificationPageParams): Promise<NotificationPage> {
  const pageSize = resolveCursorPageSize(query.pageSize);
  const search = query.search?.trim() ?? "";
  const ascending = query.sort?.direction === "asc";
  const direction = ascending ? "asc" : "desc";
  const cursor = decodeTimestampCursor(query.cursor);

  const rows = await prisma.notification.findMany({
    where: {
      AND: [
        buildAudienceFilter(scope),
        buildReadStatusFilter(query.filters?.status, scope.userId),
        buildSearchFilter(search),
        buildCursorFilter(cursor, ascending),
      ],
    },
    orderBy: [{ createdAt: direction }, { id: direction }],
    take: pageSize + 1,
    include: {
      club: { select: { name: true, shortName: true } },
      reads: { where: { userId: scope.userId }, select: { id: true } },
    },
  });

  const hasMore = rows.length > pageSize;
  const page = hasMore ? rows.slice(0, pageSize) : rows;
  const last = page.at(-1);

  return {
    rows: page.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      audience: row.audience,
      clubName: row.club?.name ?? null,
      clubShortName: row.club?.shortName ?? null,
      createdAt: row.createdAt,
      isRead: row.reads.length > 0,
    })),
    nextCursor:
      hasMore && last ? encodeTimestampCursor({ timestamp: last.createdAt, id: last.id }) : null,
  };
}

export async function getUnreadNotificationCount(scope: NotificationScope): Promise<number> {
  return prisma.notification.count({
    where: {
      ...buildAudienceFilter(scope),
      reads: { none: { userId: scope.userId } },
    },
  });
}

export async function getNotificationRecipients(
  audience: NotificationAudience,
  clubId: string | null,
): Promise<{ email: string }[]> {
  return prisma.user.findMany({
    where: {
      isActive: true,
      email: { endsWith: "@acdeducation.com" },
      ...(audience === NotificationAudience.CLUB ? { clubId } : {}),
    },
    select: { email: true },
  });
}
