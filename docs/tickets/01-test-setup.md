# Ticket 1 — Test setup

- Needs: none
- Label: ready-for-agent
- Schema change: no

## Scope

DB-backed tests live apart from unit tests so `pnpm test` runs without Postgres. Add an `integration` Vitest project with its own script, a test `DATABASE_URL` on a separate database, serialized DB test files, each file starting from a clean database. Write one failing example test first, then make it pass.

## Acceptance checkboxes

1. [ ] `pnpm test` (unit project) runs without Postgres.
2. [ ] DB-backed tests live in a separate Vitest project (`integration`) with its own script (e.g. `pnpm test:integration`).
3. [ ] DB test files run serialized, and each file starts from a clean database (migrate + reseed per file).
4. [ ] One example test passes: `getNotificationsForUser` returns the right rows for a known user.
5. [ ] README documents the run commands and the "point `DATABASE_URL` at another port when 5432 is in use" procedure. Never tell anyone to kill processes.

## Guards

Setup only; no operations added. Do not weaken any existing guard.

## Minimal UI

None (docs + one passing test).
