# Ticket 14 — CSV import: ADMIN only, STUDENT accounts only

- Needs: 2, 3
- Label: ready-for-agent
- Schema change: no (uses existing User + PendingRoleAssignment)

## Scope

ADMIN only. No DEV exception, no role column.

## Acceptance checkboxes

1. [ ] ADMIN only; CSV has name + school-domain email only — no role column.
2. [ ] Creates STUDENT accounts only; existing emails are skipped and reported, never changed — the role of an existing account is never modified.
3. [ ] No duplicates with Google login/`PendingRoleAssignment`: match on unique `User.email` and `PendingRoleAssignment.email` before insert; audit entry per import.
4. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role on import.

## Guards

As per checkbox 4 for every operation added here.

## Minimal UI

Import screen with skipped/existing report.
