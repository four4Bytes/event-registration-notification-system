# Ticket 2 — Roles and permission map

- Needs: 1
- Label: ready-for-agent
- Schema change: yes (Role enum migration: add APPROVER)

## Scope

Test only the role enum and the permission map. Each later ticket tests its own operation gates.

## Acceptance checkboxes

1. [x] `Role` enum has five values: STUDENT, OFFICER, ADMIN, DEV, APPROVER. (the `ATTENDANCE_STAFF` addition in `25078a9` was reverted before it was pushed — see Follow-up below)
2. [x] `can()` map: `manageUsers` = ADMIN|DEV; `sendNotifications` = OFFICER|ADMIN|DEV; `markAttendance` = ATTENDANCE_STAFF|ADMIN; DEV stays support-only, not a business role. (**superseded by ADR-0007**: `markAttendance` = OFFICER|ADMIN)
3. [x] Administrator assigns ATTENDANCE_STAFF/APPROVER through existing user management (role dropdown lists six roles); `PendingRoleAssignment.role` accepts the new values with no model change. (**superseded by ADR-0007**: only APPROVER is assignable)
4. [x] Enum + map unit-tested, each denied role asserted on the map itself.

## Guards

Every check here requires authentication, refuses suspended/inactive accounts, and asserts the map result for each denied role. A refused role reaching a page gets a clean redirect to the access-denied page, never a 500 (`requirePagePermission`, `8ee5891`).

## Minimal UI

Role dropdown shows the new APPROVER role in user management.

## Follow-up corrections required by ADR-0007 (applied in `59413b2`)

Status: done at `25078a9`, with the corrections below applied. They were code changes, so they could not be done in the ADR-0007 docs commit. The `rbac.test.ts` rows and the `roles.integration.test.ts` user row changed because ADR-0007 supersedes ADR-0001's settled role decision — the matrix still asserts every role against every permission, and no guard was weakened: the rows removed here asserted a role that no longer exists, a test now enforces full role × permission coverage with its denied cases, and every permission keeps denied roles.

1. [x] `rbac.ts`: `markAttendance` returns true for OFFICER or ADMIN only.
2. [x] `rbac.test.ts`: `OFFICER markAttendance → true`; the `ATTENDANCE_STAFF` rows go with the role, and a new assertion refuses a matrix that drops any role × permission pair, denied cases included.
3. [x] `schemas.ts`: drop `Role.ATTENDANCE_STAFF` from `AssignableRoleSchema` so it cannot be assigned to a `User` or a `PendingRoleAssignment`.
4. [x] `UsersManagement.tsx`, `AddUserModal.tsx`, `EditRoleModal.tsx`: drop `Role.ATTENDANCE_STAFF` from the three `roles` arrays (dropdown lists four assignable roles).
5. [x] `constants.ts`: `roleLabels` no longer carries an `ATTENDANCE_STAFF` key, because the enum no longer has the value.
6. [x] `roles.integration.test.ts`: the `ATTENDANCE_STAFF` user row becomes `OFFICER`, the `APPROVER` `PendingRoleAssignment` assertion stays, and the database enum is asserted to reject `ATTENDANCE_STAFF`.
7. [x] Rewrite the unpushed migration `20261016004500_add_staff_approver_roles` to add only `APPROVER` and rename it `20261016004500_add_approver_role`; recreate the disposable databases, re-run the migrations and reseed.
8. [x] Re-run `pnpm test`, `pnpm test:integration`, `pnpm lint`, `tsc --noEmit` and show the results.
