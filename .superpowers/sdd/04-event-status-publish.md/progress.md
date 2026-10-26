# SDD ledger — plan: docs/tickets/04-event-status-publish.md

Plan source: `docs/tickets/04-event-status-publish.md` + the user's Step 1 list
(no separate plan file exists; the executable plan is the ticket).

Spec: `docs/MVP-SPEC.md`, `GLOSSARY.md`, `docs/DECISIONS.md`, ADR-0005, ADR-0007.

Baseline (before any change): `pnpm test` → 7 files / 43 tests pass;
`pnpm test:integration` → 4 files / 6 tests pass.

Pre-flight scan: ticket 04 is self-contained. The only shared interface with
ticket 05 is `EventStatus` + `Event.status` (05 consumes them) and the
transition table (05 wires the holder decisions into it) — 05 removes the
temporary publish path on purpose, so no conflict.

## Rulings carried

- Setup: working in-place on `main` (no worktree). The user's GUARD pins the
  working directory to this repo, so an isolated worktree would violate it.
  Cost if wrong: work lands on `main` instead of a branch.
- Setup: ledger kept at `.superpowers/sdd/...` and left untracked. `.superpowers/`
  is not in `.gitignore`; the guard already forbids blanket staging, so no
  `.gitignore` change was made. Cost if wrong: scratch dir shows in status.
- Setup: the skill's `scripts/task-start` / `task-done` are bash and unused on
  this Windows host; their effect (run the named test command, append a ledger
  line) is done by hand with PowerShell. Cost if wrong: none.
- Setup: the ticket-04 prompt "from the previous message" is not available in
  this session; the ticket file plus the user's Step 1 list is the plan. Cost if
  wrong: wording of the original prompt may have asked for something extra.
- Task 2: `publishEvent` is OFFICER | ADMIN, DEV excluded. GLOSSARY says DEV is
  "not a business role in approvals", and `markAttendance` already excludes DEV,
  while `manageUsers`/`sendNotifications` grant it. Cost if wrong: DEV cannot
  publish through the UI, one line in `rbac.ts`.
- Task 5: status update and audit write are two sequential calls, not one
  transaction (no transaction pattern exists anywhere in the repo, and
  `writeAuditLog` owns its own `requireAuth`). Cost if wrong: a crash between the
  two writes leaves one unaudited transition.

## Tasks

Task 1: publishEvent permission — complete (commit fafa400, tests: `pnpm vitest run --project unit rbac` → 21/21)
Task 2: EventStatus + Event.status + additive migration — complete (commit 2b8f4d5, tests: `--project integration schema` → 2/2)
Task 3: transition table + canRegister — complete (commit 134621a, tests: `--project unit lifecycle` → 29/29)
Task 4: events slice (schemas/queries/mutations/actions) — complete (commit c05ed83, tests: integration events/queries 2/2, events/actions 12/12)
Task 5: events list page + sidebar + header — complete (commits 1a37f03, bc3c9eb)
Task 6: seed one event per lifecycle state — complete (commit 0b722a5, `pnpm prisma:seed` → 7 events)
Task 7: docs reconciliation (ADR-0005, GLOSSARY, MVP-SPEC, ticket 04, ticket index) — complete (commit 73bef94)
Task 8: whole-ticket verification — `pnpm test` 8 files/77, `pnpm test:integration` 7 files/22, `pnpm lint` exit 0, `tsc --noEmit` exit 0; `pnpm build` blocked by missing AUTH_GOOGLE_ID in .env (pre-existing, unrelated)
Task 9: end-to-end page check on port 3001 — officer `/events` 200 with 7 rows and 7 Publish buttons; student `/events` 200 with 1 row, 0 Publish buttons, no draft title

Open (not ticket 04's to close): ticket 04 checkbox 2's attendance-in-window clause — belongs to tickets 8 and 6/7.

## Ticket 05

Ruling (pre-build, after `git fetch origin`): `origin/main` has diverged by
design — no `APPROVER` role, no `AuditLog` model, RBAC replaced by
`PERMISSION_MATRIX` + `entity.action` + `documentation/RBAC.md`, docs moved to
`documentation/`. A rebase conflicts in 8 files. The user chose to build on the
local line and reconcile later; ticket 04 was pushed to `fork/main` (fast-forward
from cca2048). origin is untouched. Cost if wrong: integration with the team's
RBAC refactor is deferred, and `publishEvent` will need renaming to their
`entity.action` scheme if the lines are ever merged.

Rulings (user's five, plus mine):

- Ruling (user 1): `writeAuditLog` accepts an optional Prisma transaction
  client; the status write and its audit row commit together; the auth check
  stays inside the helper. Applied to ticket 04's publish action, with a
  rollback test.
- Ruling (user 2): `publishEvent` stays OFFICER | ADMIN and applies only to
  APPROVED events; a holder's approval moves PENDING_APPROVAL to APPROVED and
  never publishes. Temporary edges removed.
- Ruling (user 3): the ADR-0005 edit stands.
- Ruling (user 5): MVP-SPEC line 61 corrected to separate the holder decision
  from the publish permission.
- Ruling (mine): a new `ApprovalDecision` model records one decision row per
  (event, step). Ticket 05 lists only `ApprovalStep`, but the chain cannot
  advance, and checkbox 9 ("every approval records the approver and their
  role") cannot hold, without a per-event decision record. Decisions are
  upserted on re-decision so the unique constraint holds and the audit log
  keeps the full history. Cost if wrong: one extra table.
- Ruling (mine): `condition` is descriptive data, not evaluated logic, and
  every seeded step is mandatory. Evaluating "Dean only off-campus" needs the
  Council's sign-off and an event-type field the MVP does not have.
- Ruling (mine): submit-for-approval is guarded by `publishEvent` (staff), not
  by a new permission, so the rbac matrix and its documented rows stay stable.
- Ruling (mine): the step-holder check replaces `can()` for approval
  decisions, because ticket 05 checkbox 2 defines the check as "the acting user
  is a holder of the current step". It lives in one place,
  `src/features/events/approval.ts`, and role only constrains who may be
  assigned as a holder (APPROVER | OFFICER | ADMIN, per checkbox 6).
- Ruling (mine): the holder-assignment control lives at `/admin/approvals`
  (Admin-only, `manageUsers`), mirroring `/admin/users`, rather than inside the
  event page.

### Ticket 05 tasks
