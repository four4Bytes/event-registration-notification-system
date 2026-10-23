import { previewClubs } from "@/app/dev/previews/_data/preview-clubs";
import { ClubsManagement } from "@/features/clubs/components/ClubsManagement/ClubsManagement";

export default function ClubsPreviewPage() {
  return <ClubsManagement initialRows={previewClubs} initialCursor={null} />;
}
