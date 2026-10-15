# Ticket 3 — Audit log foundation

- Needs: 1
- Label: ready-for-agent
- Schema change: yes (new AuditLog model)

## Scope

Add the `AuditLog` model and one helper. No separate Auditor role — the helper writes with the caller's auth context.

## Acceptance checkboxes

1. [ ] `AuditLog` model added (entityType, entityId, action, actorId, actorRole, details JSON, createdAt).
2. [ ] `writeAuditLog()` helper inserts entries using the caller's auth context.
3. [ ] Helper tested: writes actor, time, old/new state; refuses unauthenticated callers.

## Guards

Helper requires authentication; suspended/inactive callers refused.

## Minimal UI

None (helper + model).
