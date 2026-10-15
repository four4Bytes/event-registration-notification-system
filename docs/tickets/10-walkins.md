# Ticket 10 — Walk-in audit, counting and review

- Needs: 9
- Label: ready-for-agent
- Schema change: no (uses flag fields from Ticket 9 + AuditLog from Ticket 3)

## Scope

Walk-in behavior on top of Ticket 9's flagged rows — no redefinition of the flag.

## Acceptance checkboxes

1. [ ] Walk-in requires a reason + recording actor (ATTENDANCE_STAFF/ADMIN, not ApprovalAuthority); each walk-in writes an audit entry.
2. [ ] Walk-ins counted separately from registered attendance in queries.
3. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role on walk-in recording.

## Guards

As per checkbox 3 for every operation added here.

## Minimal UI

Walk-in form (reason field) + separately-counted walk-in list.
