# Ticket 16 — REST and OpenAPI

- Needs: 1–15 (all features)
- Label: ready-for-agent
- Schema change: no (routes + spec only)

## Scope

The repo has no feature REST routes (only `src/app/api/auth/[...nextauth]/route.ts`; features use server actions). Build thin v1 routes reusing the existing auth/suspended/role checks — no new gates introduced here.

## Acceptance checkboxes

1. [ ] Thin v1 routes call the same functions with the existing `requireAuth`/suspended/role checks.
2. [ ] 401 for unauthenticated, 403 for denied role tested per route (never 500 on bad id).
3. [ ] OpenAPI documents every route grouped by feature.

## Guards

Verification only: reuses the guards from Tickets 2–15; 401/403 tests per route.

## Minimal UI

None (routes + spec).
