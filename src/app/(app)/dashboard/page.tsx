import { countSubmittedEvents } from "@/features/events/queries";
import { getNotificationPage } from "@/features/notifications/queries";
import { buildNotificationScope } from "@/features/notifications/scope";
import {
  countActiveUsersByRole,
  countPendingRoleAssignments,
  getPresident,
} from "@/features/users/queries";
import { Role } from "@/generated/prisma/browser";
import { auth } from "@/lib/infra/auth";
import { getDaypartGreeting } from "@/lib/primitives/date";
import { requirePagePermission } from "@/lib/security/auth-guards";

import { AdminDashboard } from "./_components/AdminDashboard/AdminDashboard";
import {
  StudentDashboard,
  type DashboardNotification,
} from "./_components/StudentDashboard/StudentDashboard";

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role === Role.ADMIN || role === Role.DEV) {
    await requirePagePermission("user.read");

    const [students, activeOfficers, pendingInvitations, submittedEvents, president] =
      await Promise.all([
        countActiveUsersByRole(Role.STUDENT),
        countActiveUsersByRole(Role.OFFICER),
        countPendingRoleAssignments(),
        countSubmittedEvents(),
        getPresident(),
      ]);

    return (
      <AdminDashboard
        presidentName={president?.name ?? null}
        stats={{ students, activeOfficers, pendingInvitations, submittedEvents }}
      />
    );
  }

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
