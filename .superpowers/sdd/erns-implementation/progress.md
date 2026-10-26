# SDD ledger — plan: user-supplied ERNS reset + implementation brief (chat, no plan file)

Spec read: `docs/MVP-SPEC.md`, ADR-0001..0008, tickets 06/07/08 from backup branch
`backup-main-pre-reset-20261018` (product design was never on origin/main).

Baseline: `main` == `origin/main` == `744cc69` (upstream: roles STUDENT/OFFICER/ADMIN/DEV,
clubs, notifications, RBAC matrix; no events slice, no tests, `Attendance` = check-in only).

Recovery: `backup-main-pre-reset-20261018` @ `63a24cb` holds the pre-reset `main` plus a WIP
commit of the dirty tree. `backup-wrong-docs` @ `6f16614` untouched.

Ruling: no commits for this implementation — the brief's acceptance criteria say "no commits
have been performed", overriding the executing-plans commit-per-task step and AGENTS.md is
silent-to-opposed. Progress is tracked here and by changed-file lists.

Ruling: backup snapshot of the dirty tree needed a commit (only durable recovery reference);
made on a dedicated branch, never on `main`. Cost if wrong: one extra local branch/commit.

Ruling: approval chain (ticket 5) is out of scope — spec marks it "pending sign-off" and the
brief lists publish/cancel only. Event lifecycle = DRAFT/PUBLISHED/CANCELLED. Cost if wrong:
an approval workflow must be added later, schema gets two more enum members.

Ruling: keep `Attendance.checkedInAt` (no rename to `markedPresentAt`); add walk-in fields
only. Cost if wrong: one rename migration later.

## Phases

1. git safety: done (inspection, backup branch, reset to origin/main, upstream retarget)
2. baseline inspection: done
3. email domain centralization: todo
4. RBAC rows + docs: todo
5. schema + migration (EventRegistration, Event status/capacity/window/audience, Attendance walk-in): todo
6. events feature (schemas/queries/mutations/actions): todo
7. registration actions: todo
8. attendance feature: todo
9. UI (events list/detail, form modal, attendance, sidebar): todo
10. hardening (email escaping, SMTP failure, pending-user domain): todo
11. tests + quality gates: todo
12. docs (README, documentation/*): todo
