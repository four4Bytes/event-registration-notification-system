# Ticket 4 — Event status and publish transitions

- Needs: 2, 3
- Label: built on assumptions, pending sign-off
- Schema change: yes (EventStatus enum + Event.status)

## Scope

Event lifecycle with a temporary publish path until the approval chain (Ticket 5) lands.

## Acceptance checkboxes

1. [x] `EventStatus` enum + `Event.status` defaulting to DRAFT.
2. [ ] Only PUBLISHED accepts registration; attendance requires a published event inside its window. — the registration half is done (`canRegister`, tested); the attendance clause belongs to Ticket 8 and the window to Tickets 6/7, so it stays open.
3. [x] Transition table enforced (DRAFT→PENDING_APPROVAL→APPROVED→PUBLISHED, with REVISION_REQUESTED/REJECTED/CANCELLED branches); temporary ADMIN/OFFICER publish allowed until Ticket 5 lands.
4. [x] Each transition writes an audit entry; role gate tested per denied role; suspended/inactive refused.

## Guards

Authentication, suspended/inactive refusal, and a role gate tested for each denied role on every transition added here.

## Minimal UI

Status badge + Publish button on the event page (ADMIN/OFFICER only).

Assumptions: Council-final and conditional-step semantics from the grill, pending sign-off.

## Status

Committed `fafa400`..`0b722a5` (code) and the ticket-4 docs commit. Migration `20261018123931_add_event_status` is additive: it creates one enum and adds one column with a default, so it rewrites no existing row.

- The seven-state machine is enforced in one place, `src/features/events/lifecycle.ts` `canTransition`; `canRegister` is the registration gate the later tickets extend. Both are pure and unit-tested (29 tests).
- The table carries a marked shortcut: `PUBLISHED` is reachable from `DRAFT`, `PENDING_APPROVAL` and `REVISION_REQUESTED` as well as `APPROVED`. Ticket 5 removes those three edges and adds the test that publishing without a completed chain is refused.
- `publishEvent` = OFFICER | ADMIN. DEV is excluded, matching `markAttendance` and the GLOSSARY's "DEV is not a business role in approvals". The matrix is complete: 5 roles x 4 permissions = 20 rows, denied cases included.
- `publishEventAction` returns the shared envelope: `validation`, `forbidden`, `unauthorized`, `not_found` or `conflict`, each tested. A successful publish writes exactly one audit entry, `{ previousState: { status }, newState: { status } }`, with no personal data in `details`.
- The status write and its audit entry are two sequential calls, not one transaction: no transaction pattern exists elsewhere in the repo, and `writeAuditLog` owns its own auth context. A crash between the two would leave one unaudited transition (recorded as a known limit).
- A student's `/events` shows PUBLISHED rows only. The filter is server-side in `getEvents(viewerRole)`, and the integration test asserts the whole row shape, so no extra field reaches the page.

Evidence (all run on this working copy):

| Check                   | Result                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`             | 8 files / 77 tests pass                                                                                                                                          |
| `pnpm test:integration` | 7 files / 22 tests pass                                                                                                                                          |
| `pnpm lint`             | exit 0                                                                                                                                                           |
| `tsc --noEmit`          | exit 0                                                                                                                                                           |
| `pnpm build`            | fails in page-data collection on `AUTH_GOOGLE_ID` missing from `.env` — pre-existing, unrelated to this ticket, blocks the OAuth client the plan already assigns |
