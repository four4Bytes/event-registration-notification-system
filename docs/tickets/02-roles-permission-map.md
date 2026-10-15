# Ticket 2 — Roles and permission map

- Needs: 1
- Label: ready-for-agent
- Schema change: yes (Role enum migration: add ATTENDANCE_STAFF, APPROVER)

## Scope

Test only the role enum and the permission map. Each later ticket tests its own operation gates.

## Acceptance checkboxes

1. [ ] `Role` enum migrated to six values: STUDENT, OFFICER, ADMIN, DEV, ATTENDANCE_STAFF, APPROVER.
2. [ ] `can()` map: `manageUsers` = ADMIN|DEV; `sendNotifications` = OFFICER|ADMIN|DEV; `markAttendance` = ATTENDANCE_STAFF|ADMIN; DEV stays support-only, not a business role.
3. [ ] Administrator assigns ATTENDANCE_STAFF/APPROVER through existing user management (role dropdown lists six roles); `PendingRoleAssignment.role` accepts the new values with no model change.
4. [ ] Enum + map unit-tested, each denied role asserted on the map itself.

## Guards

Every check here requires authentication, refuses suspended/inactive accounts, and asserts the map result for each denied role.

## Minimal UI

Role dropdown shows the two new roles in user management.
