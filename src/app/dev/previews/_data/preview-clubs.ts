import type { ClubRow } from "@/features/clubs/queries";

export const previewClubIds = {
  jpcs: "clx0000000000000000000001",
  lits: "clx0000000000000000000002",
  rcy: "clx0000000000000000000003",
  ssc: "clx0000000000000000000004",
} as const;

export const previewClubs: ClubRow[] = [
  {
    id: previewClubIds.jpcs,
    name: "Junior Philippine Computer Society",
    shortName: "JPCS",
    createdAt: new Date("2025-08-12T09:00:00+08:00"),
    memberCount: 1,
    eventCount: 1,
    notificationCount: 1,
  },
  {
    id: previewClubIds.lits,
    name: "League of Information Technology Students",
    shortName: "LITS",
    createdAt: new Date("2025-08-10T09:00:00+08:00"),
    memberCount: 3,
    eventCount: 2,
    notificationCount: 2,
  },
  {
    id: previewClubIds.rcy,
    name: "Red Cross Youth",
    shortName: "RCY",
    createdAt: new Date("2025-08-14T09:00:00+08:00"),
    memberCount: 1,
    eventCount: 1,
    notificationCount: 1,
  },
  {
    id: previewClubIds.ssc,
    name: "Supreme Student Council",
    shortName: "SSC",
    createdAt: new Date("2025-08-08T09:00:00+08:00"),
    memberCount: 1,
    eventCount: 1,
    notificationCount: 1,
  },
];
