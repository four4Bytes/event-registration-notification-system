import { ClubsManagement } from "@/features/clubs/components/ClubsManagement/ClubsManagement";
import { getClubPage } from "@/features/clubs/queries";
import { requirePagePermission } from "@/lib/security/auth-guards";

export default async function ClubsPage() {
  await requirePagePermission("club.read");
  const page = await getClubPage({ pageSize: 10 });
  return <ClubsManagement initialRows={page.rows} initialCursor={page.nextCursor} />;
}
