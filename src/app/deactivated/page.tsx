import { Link } from "@/components/ui/Link/Link";
import { NoticePage } from "@/components/ui/NoticePage/NoticePage";

import { DeactivatedSignOut } from "./deactivated-sign-out";

interface DeactivatedPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function DeactivatedPage({ searchParams }: DeactivatedPageProps) {
  const { reason } = await searchParams;
  const isDeactivated = reason === "deactivated";

  const title = isDeactivated ? "Account Deactivated" : "Signed Out";
  const message = isDeactivated
    ? "Your account has been deactivated. Please contact your administrator if this is a mistake."
    : "Your session has ended. Please sign in again.";

  return (
    <>
      <DeactivatedSignOut />
      <NoticePage title={title} message={message}>
        <Link href="/sign-in">Back to Sign In</Link>
      </NoticePage>
    </>
  );
}
