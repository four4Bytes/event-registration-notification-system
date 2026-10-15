# Ticket 5 — Approval chain steps and authority

- Needs: 4
- Label: built on assumptions, pending sign-off
- Schema change: yes (ApprovalStep + ApprovalAuthority models)

## Scope

Ordered, conditional approval chain as data. Council = an OFFICER holding an active ApprovalAuthority with `authorityScope: "Council"` (no new role).

## Acceptance checkboxes

1. [ ] `ApprovalStep` (eventType, stepOrder, condition, authorityRequired, isMandatory) and `ApprovalAuthority` (userId, role, scope, delegation refs, isActive, timestamps) models.
2. [ ] Check is "has an active ApprovalAuthority for the current step" — on APPROVER, or on OFFICER for the Council step; skipping a step refused.
3. [ ] Every decision (approve, reject, request revision, delegate) writes an audit entry; config changes are records, not code.
4. [ ] Remove Ticket 4's temporary ADMIN/OFFICER publish path; add a test that publishing without a completed approval chain is refused.
5. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role on each step action.

## Guards

As per checkbox 5 for every operation added here.

## Minimal UI

Step list with Approve/Reject/Request-revision buttons per current step.

Assumptions: Council/Dean/OSA/Security conditions pending sign-off.
