# Ticket 12 — Club officer contacts and officer email on publish

- Needs: 4, 11
- Label: built on assumptions, pending sign-off
- Schema change: yes (club officer-contact metadata model)

## Scope

Officers are not Users. Council = OFFICER with active Council-scope ApprovalAuthority.

## Acceptance checkboxes

1. [ ] Officer contacts are club metadata entered by Administrator or Council (not Users), with an admin screen.
2. [ ] On publish, each officer gets event details + mechanics checklist; email failure never blocks publishing.
3. [ ] Council sees officer name, club, SENT/FAILED only; full emails and delivery detail are Administrator-only.
4. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role on contact editing and log viewing.

## Guards

As per checkbox 4 for every operation added here.

## Minimal UI

Officer-contacts screen + publish-triggered send log.

Assumptions: email sender/hosting unconfirmed.
