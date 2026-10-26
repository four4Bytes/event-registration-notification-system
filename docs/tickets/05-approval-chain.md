# Ticket 5 — Approval chain steps and holders

- Needs: 4
- Label: built on assumptions, pending sign-off
- Schema change: yes (ApprovalStep model — office + holder users)

## Scope

Ordered, conditional approval chain as data. One `ApprovalStep` per office (Council, Dean, OSA, Security); an Administrator sets the user(s) holding each step. The Council step's holder is an OFFICER user; a step's holder may also be an APPROVER or an ADMIN, in every case only when explicitly assigned, and an Administrator may hold every step for a small organization or a demo (ADR-0007 §8; ASSUMED, pending sign-off). No `ApprovalAuthority` model and no delegation (ADR-0007; delegation is Phase 2).

## Acceptance checkboxes

1. [ ] `ApprovalStep` model: `office`, `stepOrder`, `condition`, `isMandatory`, and its holder users; holders are set by an Administrator and reassignable at any time.
2. [ ] Permission check is "the acting user is a holder of the current step"; skipping a step refused.
3. [ ] Every decision (approve, reject, request revision) writes an audit entry; every reassignment of a step's holders writes an audit entry; config changes are records, not code.
4. [ ] Remove Ticket 4's temporary ADMIN/OFFICER publish path; add a test that publishing without a completed approval chain is refused.
5. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role on each step action.
6. [ ] A step's holder may be an APPROVER, an OFFICER (the Council step) or an ADMIN, in every case only when an Administrator has assigned that user to the step.
7. [ ] An ADMIN is refused on a step it is not assigned to.
8. [ ] Approving, rejecting or requesting revision on an event the actor created or submitted is refused, even when the actor holds the step.
9. [ ] Every approval records the approver and their role; every assignment or reassignment of a step's holders writes an audit entry (see also checkbox 3).
10. [ ] Create `src/test-utils/` with the shared auth mock and database-reset helper, and move the four per-file `resetDatabase` copies (`users/queries`, `users/roles`, `notifications/queries`, `audit/write-audit-log`) plus the hand-built auth mock onto it (`AGENTS.md:230`). The audit copy already diverges — it truncates only `AuditLog` and `User`.

## Guards

As per checkbox 5 for every operation added here.

## Minimal UI

Step list with Approve/Reject/Request-revision buttons per current step, plus the Administrator's holder-reassignment control.

Assumptions: Council/Dean/OSA/Security conditions pending sign-off; a step's holder may be an APPROVER, an OFFICER or an ADMIN only when assigned; an ADMIN may be assigned to every step for a small organization or a demo; no user may approve an event they created (ADR-0007 §8; ASSUMED, pending sign-off).
