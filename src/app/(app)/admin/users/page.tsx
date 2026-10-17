import { getUserManagementRowsAction } from "@/features/users/actions";
import { UsersManagement } from "@/features/users/components/UsersManagement/UsersManagement";
import { requireAuth } from "@/lib/security/auth-guards";
import { requirePagePermission } from "@/lib/security/page-guards";

export default async function UsersPage() {
  const user = await requireAuth();
  requirePagePermission(user, "manageUsers");
  const rows = await getUserManagementRowsAction("");
  return <UsersManagement initialRows={rows} />;
}
