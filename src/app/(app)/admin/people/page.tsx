import { UsersManagement } from "@/features/users/components/UsersManagement/UsersManagement";
import { getPresident, getUserManagementPage } from "@/features/users/queries";
import { requirePagePermission } from "@/lib/security/auth-guards";

export default async function PeoplePage() {
  const actor = await requirePagePermission("user.read");
  const [page, president] = await Promise.all([
    getUserManagementPage({ pageSize: 10 }),
    getPresident(),
  ]);
  return (
    <UsersManagement
      initialRows={page.rows}
      initialCursor={page.nextCursor}
      currentUserId={actor.id}
      presidentName={president?.name ?? null}
    />
  );
}
