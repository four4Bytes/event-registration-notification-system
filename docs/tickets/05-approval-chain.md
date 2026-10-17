# Ticket 5 — Approval chain steps and holders

- Needs: 4
- Label: built on assumptions, pending sign-off
- Schema change: yes (ApprovalStep model — office + holder users)

## Scope

Ordered, conditional approval chain as data. One `ApprovalStep` per office (Council, Dean, OSA, Security); an Administrator sets the user(s) holding each step. The Council step's holder is an OFFICER user. No `ApprovalAuthority` model and no delegation (ADR-0007; delegation is Phase 2).

## Acceptance checkboxes

1. [ ] `ApprovalStep` model: `office`, `stepOrder`, `condition`, `isMandatory`, and its holder users; holders are set by an Administrator and reassignable at any time.
2. [ ] Permission check is "the acting user is a holder of the current step"; skipping a step refused.
3. [ ] Every decision (approve, reject, request revision) writes an audit entry; every reassignment of a step's holders writes an audit entry; config changes are records, not code.
4. [ ] Remove Ticket 4's temporary ADMIN/OFFICER publish path; add a test that publishing without a completed approval chain is refused.
5. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role on each step action.

## Guards

As per checkbox 5 for every operation added here.

## Minimal UI

Step list with Approve/Reject/Request-revision buttons per current step, plus the Administrator's holder-reassignment control.

Assumptions: Council/Dean/OSA/Security conditions pending sign-off.
