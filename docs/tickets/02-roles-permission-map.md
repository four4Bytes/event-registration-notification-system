# Ticket 2 — Roles and permission map

- Needs: 1
- Label: ready-for-agent
- Schema change: yes (Role enum migration: add ATTENDANCE_STAFF, APPROVER)

## Scope

Test only the role enum and the permission map. Each later ticket tests its own operation gates.

## Acceptance checkboxes

1. [x] `Role` enum migrated to six values: STUDENT, OFFICER, ADMIN, DEV, ATTENDANCE_STAFF, APPROVER. (committed `25078a9`; `ATTENDANCE_STAFF` later deprecated by ADR-0007 — see Follow-up below)
2. [x] `can()` map: `manageUsers` = ADMIN|DEV; `sendNotifications` = OFFICER|ADMIN|DEV; `markAttendance` = ATTENDANCE_STAFF|ADMIN; DEV stays support-only, not a business role. (**superseded by ADR-0007**: `markAttendance` = OFFICER|ADMIN)
3. [x] Administrator assigns ATTENDANCE_STAFF/APPROVER through existing user management (role dropdown lists six roles); `PendingRoleAssignment.role` accepts the new values with no model change. (**superseded by ADR-0007**: only APPROVER is assignable)
4. [x] Enum + map unit-tested, each denied role asserted on the map itself.

## Guards

Every check here requires authentication, refuses suspended/inactive accounts, and asserts the map result for each denied role.

## Minimal UI

Role dropdown shows the two new roles in user management.

## Follow-up corrections required by ADR-0007 (not yet applied)

Status: done at `25078a9`, with the corrections below outstanding. They are code changes, so they cannot be done in the ADR-0007 docs commit. The two `rbac.test.ts` assertions and the one `roles.integration.test.ts` row change because ADR-0007 supersedes ADR-0001's settled role decision — the matrix still asserts every role against every permission, and a denied-role assertion is added, not removed.

1. [ ] `rbac.ts`: `markAttendance` returns true for OFFICER or ADMIN only.
2. [ ] `rbac.test.ts`: `OFFICER markAttendance → true`, `ATTENDANCE_STAFF markAttendance → false` (denied-role assertion kept).
3. [ ] `schemas.ts`: drop `Role.ATTENDANCE_STAFF` from `AssignableRoleSchema` so it cannot be assigned to a `User` or a `PendingRoleAssignment`.
4. [ ] `UsersManagement.tsx`, `AddUserModal.tsx`, `EditRoleModal.tsx`: drop `Role.ATTENDANCE_STAFF` from the three `roles` arrays (dropdown lists five).
5. [ ] `constants.ts`: keep the `ATTENDANCE_STAFF` key (required by `Record<Role, string>`) labelled as deprecated.
6. [ ] `roles.integration.test.ts`: replace the `ATTENDANCE_STAFF` user row with `OFFICER`, and keep an `APPROVER` `PendingRoleAssignment` assertion.
7. [ ] Re-run `pnpm test`, `pnpm test:integration`, `pnpm lint`, `tsc --noEmit` and show the results.
