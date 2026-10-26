# SDD ledger — plan: Admin brief Phase 4 — Events

Plan source: `C:\Users\Tanya Mae\AppData\Local\Temp\opencode\admin-brief.txt` (Phase 4),
`docs/superpowers/specs/2026-10-25-kasama-model-design.md` (Phase B + C).

## Scope

- Reconcile the already-applied Phase C migration (`RegistrationStatus`, `Registration`,
  `User.studentNumber`) into `schema.prisma`; no new migration, no DB change.
- Admin `/admin/events`: list, detail, create, edit, submit, cancel, unpublish.
- Required mechanics/program flow/requirements gate submission only; drafts save without them.
- Optional capacity and registration deadline.
- Detail shows registered count, seats left, assigned attendance scanners, and the approval trail.
- Student `/events`, `/events/[eventId]`, `/registrations`, and ticket pages read the DB while
  keeping the existing design.
- Student registration create/cancel is DB-backed so counts and tickets are real.

## Rulings

- Ruling: Phase C is already applied by `20261026120000_kasama_phase_c`; reconcile the schema only.
  The user approved Phase 4 after the Phase 3 ledger flagged Phase C for Phase 4.
  Cost if wrong: schema drift, no data loss.
- Ruling: Stay in the current `feat/admin-phase-1` workspace; all Phase 1–3 work is uncommitted and
  commits are prohibited by AGENTS.md. Cost if wrong: a larger uncommitted diff.
- Ruling: Legacy `EventRegistration`, `Event.registrationDeadline`, and `Event.registrationOpens`
  stay untouched; the approved spec uses `Registration` and `registrationClosesAt`.
  Cost if wrong: unused legacy columns remain.
- Ruling: Student registration uses the existing opaque `reference`; no QR scanning yet (Phase 6).
  Cost if wrong: tickets are display-only until scanning ships.

## Tasks

1. Reconcile Phase C schema; `prisma format`, `prisma generate`, `prisma validate`, `tsc`.
2. Event + registration schemas with tests.
3. Event + registration queries with tests.
4. Event lifecycle mutations with tests.
5. Registration mutations with tests.
6. Server actions and guard tests.
7. Admin events list/detail/form UI.
8. Student event/registration pages DB-backed, design preserved.
9. Full gate + click-through + docs.

## Verification

- `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- Admin: create draft, submit blocked without mechanics, submit, approve, unpublish, cancel.
- Student: published event visible, register, ticket, cancel, counts update.
- Student denied `/admin/events` redirects to `/access-denied`.
