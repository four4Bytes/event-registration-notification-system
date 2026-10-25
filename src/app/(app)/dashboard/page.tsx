import { getNotificationPage } from "@/features/notifications/queries";
import { buildNotificationScope } from "@/features/notifications/scope";
import { auth } from "@/lib/infra/auth";
import { getDaypartGreeting } from "@/lib/primitives/date";

import {
  StudentDashboard,
  type DashboardNotification,
} from "./_components/StudentDashboard/StudentDashboard";

export default async function DashboardPage() {
  const session = await auth();

  let notifications: DashboardNotification[] = [];
  if (session?.user) {
    const page = await getNotificationPage({
      scope: buildNotificationScope(session.user),
      query: { pageSize: 3 },
    });
    notifications = page.rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
    }));
  }

  return (
    <StudentDashboard
      greeting={getDaypartGreeting()}
      userName={session?.user?.name ?? null}
      notifications={notifications}
    />
  );
}
