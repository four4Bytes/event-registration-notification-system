import { prisma } from "@/lib/infra/prisma";

export interface ClubWritePayload {
  name: string;
  shortName: string | null;
}

export interface ClubUpdatePayload extends ClubWritePayload {
  clubId: string;
}

export async function createClub(payload: ClubWritePayload): Promise<void> {
  await prisma.club.create({ data: payload });
}

export async function updateClub(payload: ClubUpdatePayload): Promise<void> {
  const { clubId, ...data } = payload;
  await prisma.club.update({ where: { id: clubId }, data });
}

export async function deleteClub(clubId: string): Promise<void> {
  await prisma.club.delete({ where: { id: clubId } });
}
