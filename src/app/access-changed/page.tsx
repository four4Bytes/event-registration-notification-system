import { Link } from "@/components/ui/Link/Link";
import { NoticePage } from "@/components/ui/NoticePage/NoticePage";

export default function AccessChangedPage() {
  return (
    <NoticePage
      title="Your access has changed"
      message="Your role was updated, so the admin area is no longer available. Your permissions are now up to date."
    >
      <Link href="/notifications">Go to Notifications</Link>
    </NoticePage>
  );
}
