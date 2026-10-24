import { Prisma } from "@/generated/prisma/client";
import {
  decodeCursor,
  encodeCursor,
  resolveCursorPageSize,
  type CursorPage,
} from "@/lib/domain/pagination";
import { prisma } from "@/lib/infra/prisma";

export interface ClubOption {
  id: string;
  name: string;
  shortName: string | null;
}

export interface ClubRow extends ClubOption {
  createdAt: Date;
  memberCount: number;
  eventCount: number;
  notificationCount: number;
}

export type ClubPage = CursorPage<ClubRow>;

export interface ClubUsage {
  memberCount: number;
  eventCount: number;
  notificationCount: number;
}

export interface ClubPageQuery {
  search?: string;
  cursor?: string;
  pageSize?: number;
}

interface ClubCursor {
  name: string;
  id: string;
}

function decodeClubCursor(cursor: string | undefined): ClubCursor | null {
  if (!cursor) return null;
  const parts = decodeCursor(cursor);
  const name = parts && typeof parts[0] === "string" ? parts[0] : null;
  const id = parts && typeof parts[1] === "string" ? parts[1] : null;
  if (!name || !id) return null;
  return { name, id };
}

function buildClubCursorFilter(cursor: ClubCursor | null): Prisma.ClubWhereInput {
  if (!cursor) return {};
  return {
    OR: [{ name: { gt: cursor.name } }, { name: cursor.name, id: { gt: cursor.id } }],
  };
}

function buildClubSearchFilter(search: string): Prisma.ClubWhereInput {
  return search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { shortName: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
}

export async function getClubOptions(): Promise<ClubOption[]> {
  return prisma.club.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true },
  });
}

export async function getClubPage(query: ClubPageQuery = {}): Promise<ClubPage> {
  const { search = "", cursor: rawCursor, pageSize } = query;
  const resolvedPageSize = resolveCursorPageSize(pageSize);
  const cursor = decodeClubCursor(rawCursor);

  const clubs = await prisma.club.findMany({
    where: {
      ...buildClubSearchFilter(search.trim()),
      ...buildClubCursorFilter(cursor),
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: resolvedPageSize + 1,
    select: {
      id: true,
      name: true,
      shortName: true,
      createdAt: true,
      _count: { select: { members: true, events: true, notifications: true } },
    },
  });

  const hasMore = clubs.length > resolvedPageSize;
  const page = hasMore ? clubs.slice(0, resolvedPageSize) : clubs;
  const last = page.at(-1);

  return {
    rows: page.map((club) => ({
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      createdAt: club.createdAt,
      memberCount: club._count.members,
      eventCount: club._count.events,
      notificationCount: club._count.notifications,
    })),
    nextCursor: hasMore && last ? encodeCursor([last.name, last.id]) : null,
  };
}

export async function getClubById(clubId: string): Promise<ClubOption | null> {
  return prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, name: true, shortName: true },
  });
}

export async function getClubUsage(clubId: string): Promise<ClubUsage | null> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      _count: { select: { members: true, events: true, notifications: true } },
    },
  });
  if (!club) return null;
  return {
    memberCount: club._count.members,
    eventCount: club._count.events,
    notificationCount: club._count.notifications,
  };
}

export async function findClubsByName(
  name: string,
  excludeClubId?: string,
): Promise<Pick<ClubOption, "id" | "name">[]> {
  return prisma.club.findMany({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeClubId ? { id: { not: excludeClubId } } : {}),
    },
    select: { id: true, name: true },
  });
}

export async function findClubsByShortName(
  shortName: string,
  excludeClubId?: string,
): Promise<Pick<ClubOption, "id" | "shortName">[]> {
  return prisma.club.findMany({
    where: {
      shortName: { equals: shortName, mode: "insensitive" },
      ...(excludeClubId ? { id: { not: excludeClubId } } : {}),
    },
    select: { id: true, shortName: true },
  });
}
