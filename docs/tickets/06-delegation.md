# Ticket 6 — Delegation

- Needs: 5
- Label: built on assumptions, pending sign-off
- Schema change: no (uses ApprovalAuthority.delegationId/delegatedTo from Ticket 5)

## Scope

Delegated authority for approval steps.

## Acceptance checkboxes

1. [ ] Delegated user acts for that step only via `delegatedTo`; delegation never skips steps.
2. [ ] Delegation writes an audit entry.
3. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role.

## Guards

As per checkbox 3 for every operation added here.

## Minimal UI

Delegate button + delegate picker on the step view.
