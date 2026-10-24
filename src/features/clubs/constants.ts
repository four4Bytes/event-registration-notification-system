interface LabelledClub {
  name: string;
  shortName: string | null;
}

export const LITS_CLUB_NAME = "League of Information Technology Students";
export const LITS_CLUB_SHORT_NAME = "LITS";

export function formatClubLabel(club: LabelledClub): string {
  return club.shortName ? `${club.name} (${club.shortName})` : club.name;
}
