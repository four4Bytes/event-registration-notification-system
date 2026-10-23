import type { UserManagementRow } from "@/features/users/queries";
import { Role } from "@/generated/prisma/browser";

import { previewClubIds, previewClubs } from "./preview-clubs";

const clubsById = new Map(previewClubs.map((club) => [club.id, club]));

function clubFields(clubId: string | null) {
  if (!clubId) {
    return { clubId: null, clubName: null, clubShortName: null };
  }

  const club = clubsById.get(clubId);
  if (!club) {
    throw new Error(`Unknown preview club: ${clubId}`);
  }

  return { clubId, clubName: club.name, clubShortName: club.shortName };
}

export const previewUsers: UserManagementRow[] = [
  {
    kind: "pending",
    id: "pen0000000000000000000001",
    name: null,
    email: "new.officer.lits@acdeducation.com",
    role: Role.OFFICER,
    isActive: null,
    ...clubFields(previewClubIds.lits),
    createdAt: new Date("2026-10-22T10:30:00+08:00"),
  },
  {
    kind: "user",
    id: "usr0000000000000000000001",
    name: "Maria Santos",
    email: "admin@acdeducation.com",
    role: Role.ADMIN,
    isActive: true,
    ...clubFields(null),
    createdAt: new Date("2026-10-20T09:00:00+08:00"),
  },
  {
    kind: "user",
    id: "usr0000000000000000000002",
    name: "John Rey Rabosa",
    email: "johnreyrabosa.f@gmail.com",
    role: Role.DEV,
    isActive: true,
    ...clubFields(null),
    createdAt: new Date("2026-10-19T09:00:00+08:00"),
  },
  {
    kind: "user",
    id: "usr0000000000000000000003",
    name: "Liza Mercado",
    email: "officer.lits@acdeducation.com",
    role: Role.OFFICER,
    isActive: true,
    ...clubFields(previewClubIds.lits),
    createdAt: new Date("2026-10-18T09:00:00+08:00"),
  },
  {
    kind: "user",
    id: "usr0000000000000000000004",
    name: "Miguel Tan",
    email: "officer.jpcs@acdeducation.com",
    role: Role.OFFICER,
    isActive: true,
    ...clubFields(previewClubIds.jpcs),
    createdAt: new Date("2026-10-17T09:00:00+08:00"),
  },
  {
    kind: "user",
    id: "usr0000000000000000000005",
    name: "Carlo Reyes",
    email: "student.lits@acdeducation.com",
    role: Role.STUDENT,
    isActive: true,
    ...clubFields(previewClubIds.lits),
    createdAt: new Date("2026-10-16T09:00:00+08:00"),
  },
  {
    kind: "user",
    id: "usr0000000000000000000006",
    name: "Ana Dela Cruz",
    email: "student.ssc@acdeducation.com",
    role: Role.STUDENT,
    isActive: true,
    ...clubFields(previewClubIds.ssc),
    createdAt: new Date("2026-10-15T09:00:00+08:00"),
  },
  {
    kind: "user",
    id: "usr0000000000000000000007",
    name: "Grace Lim",
    email: "student.rcy@acdeducation.com",
    role: Role.STUDENT,
    isActive: true,
    ...clubFields(previewClubIds.rcy),
    createdAt: new Date("2026-10-14T09:00:00+08:00"),
  },
  {
    kind: "user",
    id: "usr0000000000000000000008",
    name: "Paolo Garcia",
    email: "inactive.student@acdeducation.com",
    role: Role.STUDENT,
    isActive: false,
    ...clubFields(previewClubIds.lits),
    createdAt: new Date("2026-10-13T09:00:00+08:00"),
  },
];
