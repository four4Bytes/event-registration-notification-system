# Ticket 8 — Registration: confirmation reference, cancel and re-register

- Needs: 4, 7
- Label: ready-for-agent
- Schema change: yes (Registration model: status, confirmationReference, timestamps)

## Scope

One lifelong registration row per student per event.

## Acceptance checkboxes

1. [ ] One `(eventId, userId)` row with REGISTERED/CANCELLED status, registeredAt/cancelledAt, one lifetime confirmationReference preserved across cancel/re-register.
2. [ ] Capacity enforced under concurrency (locking/serializable; two-students-last-seat test).
3. [ ] Cancel refused with an attendance record; re-register re-runs eligibility/window/capacity; every change writes an audit entry.
4. [ ] STUDENT acts on own rows only; authentication, suspended/inactive refusal, and a role gate tested for each denied role on each sub-operation.

## Guards

As per checkbox 4 for every operation added here.

## Minimal UI

Register/Cancel/Re-register buttons + reference display.
