# Ticket 10 — Club officer contact and officer email on publish

- Needs: 4, 9
- Label: built on assumptions, pending sign-off
- Schema change: yes (officer-contact field on Club)

## Scope

Officers are not Users. Officer contacts are a field on `Club` (name + email) edited on the one club screen — no separate metadata model (ADR-0007). Council = a holder of the Council approval step.

## Acceptance checkboxes

1. [ ] Officer contact is a `Club` field, edited by an Administrator or a Council member; officers stay non-users.
2. [ ] On publish, each officer gets event details + mechanics checklist; email failure never blocks publishing.
3. [ ] Council sees officer name, club, SENT/FAILED only; full emails and delivery detail are Administrator-only.
4. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role on contact editing and log viewing.

## Guards

As per checkbox 4 for every operation added here.

## Minimal UI

Club screen officer-contact field + publish-triggered send log.

Assumptions: email sender/hosting unconfirmed.
