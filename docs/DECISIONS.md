# Settled decisions

The 20 decisions settled during the planning interview, one line each. Until this file existed they lived only in the planning chat, so no review could check the docs against them.

"Amended by ADR-0007" marks a decision the repository now states differently; the ADR holds the reason and the full detail. Every security and privacy guard attached to a decision stays in force unless the amendment says otherwise.

| # | Decision | ADR | Ticket |
|---|---|---|---|
| 1 | An Event is one entity; there is no separate Proposal record. | 0005 | 04 |
| 2 | A Club Officer has no login; officer participation is reinforcement only, recorded as request context. | 0001 | 02, 10 |
| 3 | The MVP defers QR scanning and is staff-assisted first. | 0006 | Phase 2 |
| 4 | The approval chain is configurable per event type and is sequential and conditional. | 0005 | 05 |
| 5 | Login is required to register. | 0001, 0002 | 07 |
| 6 | Attendance is a separate entity, for REGISTERED students only. **Amended by ADR-0007**: attendance is recorded by OFFICER or ADMIN, not `ATTENDANCE_STAFF`. | 0003 | 08 |
| 7 | One credential per registration: the QR token is the confirmation reference. | 0002 | 07 |
| 8 | A single presence record per student per event; no in/out pair in the MVP. | 0003 | 08 |
| 9 | In-app state is the truth; email is delivery only. | 0004 | 09 |
| 10 | SMS is out of the MVP; a mock seam only. | 0006 | Phase 2 |
| 11 | A student acknowledges IMPORTANT notices; the officer checklist is separate. | 0004 | 09, 10 |
| 12 | Walk-ins are an audited exception counted separately from registered attendance. **Amended by ADR-0007**: one table with an `isWalkIn` flag, recorded by OFFICER or ADMIN, and a student who already has an attendance row cannot register or re-register. | 0003 | 08 |
| 13 | Cancelling frees the slot and re-registration is allowed after fresh checks. | 0002 | 07 |
| 14 | A hard capacity cap, with no waitlist. | 0002 | 06, 07 |
| 15 | No corrections in the MVP; an Administrator data fix instead. | 0006 | Phase 2 |
| 16 | An Approver is an office account plus a delegation record. **Amended by ADR-0007**: APPROVER is a login role, and an `ApprovalStep` carries the user(s) holding it, set and reassigned by an Administrator with an audit entry per reassignment; delegation is Phase 2. | 0001, 0005, 0007 | 02, 05 |
| 17 | Minimum-necessary exposure under RA 10173: no response or log carries more personal data than the feature needs, and per-recipient email detail is Administrator-only. | 0006 | 09, 10, 12 |
| 18 | Student records are imported by CSV by an Administrator; there is no self-service upload. | 0006 | 11 |
| 19 | Evaluation is deferred; the MVP ships operational reports only. | 0006 | 12 |
| 20 | Manual reminders are in the MVP. | 0006 | 09 |

## Retired or superseded by ADR-0007

- `ATTENDANCE_STAFF` as a login role (decisions 6 and 12): dropped; the enum value remains deprecated and unused.
- `ApprovalAuthority` plus delegation (decision 16): replaced by `ApprovalStep` with holder users.
- The `BOUNCED` email outcome: removed; a delivery attempt ends as `SENT` or `FAILED`.
- The separate walk-in table (decision 12): rejected by ADR-0003.
- A separate officer-contact model (decision 2) and a separate reminders ticket (decision 20): both merged.
- A REST/OpenAPI surface: dropped conditionally, pending the course's answer on whether an API is required (ADR-0007 §7).
