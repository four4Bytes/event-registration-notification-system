import { Link } from "@/components/ui/Link/Link";
import { NoticePage } from "@/components/ui/NoticePage/NoticePage";

export default function AccessDeniedPage() {
  return (
    <NoticePage
      title="Access denied"
      message="You don't have permission to access this page. Your account may have been deactivated or your role may have changed. If this is a mistake, please contact your administrator."
    >
      <Link href="/notifications">Go to Notifications</Link>
    </NoticePage>
  );
}
