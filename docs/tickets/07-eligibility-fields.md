# Ticket 7 — Eligibility and registration fields

- Needs: 2, 4
- Label: ready-for-agent
- Schema change: yes (Event capacity, registration window, audience fields)

## Scope

Eligibility is separate from approval conditions. Approval conditions (Council, Dean, OSA, Security) are never eligibility criteria.

## Acceptance checkboxes

1. [ ] Student eligible iff: account active, school-domain email, event PUBLISHED, audience (ALL or their club) includes them, window open, capacity remains.
2. [ ] `Event` gains capacity, registration window, audience fields; capacity counts REGISTERED rows only.
3. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role on eligibility evaluation.

## Guards

As per checkbox 3 for every operation added here.

## Minimal UI

Event page shows capacity remaining + window state.
