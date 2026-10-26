# SDD ledger — plan: Admin brief Phase 3 — Approvals

## Scope

- `/admin/approvals`: queue of `SUBMITTED` events with mechanics, program flow, and requirements.
- Approve publishes immediately and writes an `APPROVED` trail row (`SUBMITTED -> PUBLISHED`).
- Request revision requires a comment and writes a `REVISION_REQUESTED` trail row.
- Admin self-approval is allowed and recorded as the actor.
- Workflow status pills for Draft, Submitted, Revision requested, Published, Cancelled.
- No event create/edit/submit UI (Admin Phase 4).

## Rulings

- Ruling: Reconcile only the applied Phase B schema (`EventStatus`, `EventApprovalAction`, `EventApproval`, Event workflow fields) — user approved it; Phase C registration stays for Phase 4 — cost if wrong: Phase 4 still needs the Phase C reconciliation.
- Ruling: Click-through uses one existing event temporarily set to `SUBMITTED`, restored to `PUBLISHED` after — user approved; no permanent data change — cost if wrong: a seed event briefly leaves the published list.
- Ruling: The approvals queue is a card list, not `ServerDataTable` — mechanics/program flow/requirements are long text and the brief asks for them visible — cost if wrong: a small custom CSS module instead of the shared table.

## Tasks

- [x] Schema reconciliation + client generate
- [x] Approval schemas + tests (6)
- [x] Approval queue query + tests (5)
- [x] Approval mutations + tests (6)
- [x] Approval actions + guard tests (8)
- [x] Approvals page, queue UI, status pill, dashboard count
- [x] Gate, click-through, docs

## Verification

- `pnpm test`: 23 files / 299 tests pass.
- `pnpm lint`: clean.
- `pnpm exec tsc --noEmit`: clean.
- `pnpm build`: clean; `/admin/approvals` builds as a dynamic route.
- Click-through (Playwright, temporary `SUBMITTED` event):
  - Dashboard count showed 1 before review and 0 after.
  - Queue showed mechanics, program flow, requirements, submitter, and the Submitted pill.
  - Approve published immediately, wrote an `APPROVED` trail row with the signed-in Admin as actor, and showed the empty state.
  - Request revision rejected an empty comment, then wrote a `REVISION_REQUESTED` row with the comment and cleared `publishedAt`.
  - Student session redirected from `/admin/approvals` to `/access-denied`.
  - Cleanup restored the event to `PUBLISHED`, restored its original fields, and removed only the temporary approval rows. All 9 events are `PUBLISHED`; the event has 0 approval rows.
