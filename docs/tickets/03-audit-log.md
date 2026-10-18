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

`details` is stored verbatim and is never redacted: a caller must never put secrets, tokens, or more personal data than the entry needs into it. Tickets 9 and 11 own redaction at their call sites, where personal data actually flows.

## Minimal UI

None (helper + model).

## Status

Committed `d87810a`. The model is additive: migration `20261018043607_add_audit_log` creates one table, one index and one foreign key, and changes no existing table.

- `writeAuditLog` lives in `src/features/audit/write-audit-log.ts`; the Prisma write lives in `src/features/audit/mutations.ts`, so nothing outside a `mutations.ts` imports Prisma (`AGENTS.md:117`). The helper is deliberately **not** a Server Action: it is internal, and a `"use server"` export would let any authenticated client write arbitrary audit entries.
- Old and new state are stored in the `details` JSON column as `{ previousState, newState }`; `actorRole` is recorded as it was at the time of the action. `AuditEntryPayload` is a `Pick` of the model plus the two states (`AGENTS.md:176`), not an inline parameter type.
- Field names follow this ticket's list and the existing schema's camelCase (`AGENTS.md:241` was corrected from `snake_case` to `camelCase` in the ticket 3 fix pass, since all 11 existing models are camelCase).
- Append-only is a convention, not enforced: no update or delete path exists in code, but nothing stops one at the database level. The hardening item is listed in `docs/MVP-SPEC.md`.

Evidence: the integration test asserts actor, actor role, time, action, entity and both states, and the two refusal tests were shown to be load-bearing — bypassing the guard fails exactly those two and nothing else. Row read back from the test database:

`PUBLISH | Event | event-1 | ADMIN | {"previousState":{"status":"APPROVED"},"newState":{"status":"PUBLISHED"}} | 2026-10-18 04:44:55.532`
