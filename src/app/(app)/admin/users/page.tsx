import { UsersManagement } from "@/features/users/components/UsersManagement/UsersManagement";
import { getUserManagementPage } from "@/features/users/queries";
import { requirePagePermission } from "@/lib/security/auth-guards";

export default async function UsersPage() {
  await requirePagePermission("user.read");
  const page = await getUserManagementPage({ pageSize: 10 });
  return <UsersManagement initialRows={page.rows} initialCursor={page.nextCursor} />;
}
