# Ticket 3 — Audit log foundation

- Needs: 1
- Label: ready-for-agent
- Schema change: yes (new AuditLog model)

## Scope

Add the `AuditLog` model and one helper. No separate Auditor role — the helper writes with the caller's auth context.

## Acceptance checkboxes

1. [x] `AuditLog` model added (entityType, entityId, action, actorId, actorRole, details JSON, createdAt).
2. [x] `writeAuditLog()` helper inserts entries using the caller's auth context.
3. [x] Helper tested: writes actor, time, old/new state; refuses unauthenticated callers.

## Guards

Helper requires authentication; suspended/inactive callers refused.

## Minimal UI

None (helper + model).

## Status

Committed `d87810a`. The model is additive: migration `20261018043607_add_audit_log` creates one table, one index and one foreign key, and changes no existing table.

- `writeAuditLog` lives in `src/features/audit/write-audit-log.ts`; the Prisma write lives in `src/features/audit/mutations.ts`, so nothing outside a `mutations.ts` imports Prisma (`AGENTS.md:117`). The helper is deliberately **not** a Server Action: it is internal, and a `"use server"` export would let any authenticated client write arbitrary audit entries.
- Old and new state are stored in the `details` JSON column as `{ previousState, newState }`; `actorRole` is recorded as it was at the time of the action. `AuditEntryPayload` is a `Pick` of the model plus the two states (`AGENTS.md:176`), not an inline parameter type.
- Field names follow this ticket's list and the existing schema's camelCase. `AGENTS.md:241` says `snake_case`; every existing model is camelCase, so the ticket matched the code rather than that line.

Evidence: the integration test asserts actor, actor role, time, action, entity and both states, and the two refusal tests were shown to be load-bearing — bypassing the guard fails exactly those two and nothing else. Row read back from the test database:

`PUBLISH | Event | event-1 | ADMIN | {"previousState":{"status":"APPROVED"},"newState":{"status":"PUBLISHED"}} | 2026-10-18 04:44:55.532`
