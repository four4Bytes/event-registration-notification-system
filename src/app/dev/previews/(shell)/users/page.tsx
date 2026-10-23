import { previewUsers } from "@/app/dev/previews/_data/preview-users";
import { UsersManagement } from "@/features/users/components/UsersManagement/UsersManagement";

export default function UsersPreviewPage() {
  return <UsersManagement initialRows={previewUsers} initialCursor={null} />;
}
