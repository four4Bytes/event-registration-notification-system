# Ticket 11 — Notification upgrades: staff send, students acknowledge IMPORTANT

- Needs: 2, 3
- Label: ready-for-agent
- Schema change: yes (per-recipient in-app rows + email delivery rows)

## Scope

Staff (OFFICER/ADMIN) send; STUDENTS acknowledge IMPORTANT notices. Current send-after-commit behavior is changed.

## Acceptance checkboxes

1. [ ] Per-recipient in-app rows with UNREAD/READ/ACKNOWLEDGED; ACK only for IMPORTANT, ACK implies read.
2. [ ] Email outcomes QUEUED, then SENT or FAILED or BOUNCED as alternatives (not a chain); BOUNCED defined but not reachable in MVP (no webhook).
3. [ ] In-app row written first and survives email failure; email outcome never alters in-app state.
4. [ ] Per-recipient detail Administrator-only (RA 10173); authentication, suspended/inactive refusal, and a role gate tested for each denied role.

## Guards

As per checkbox 4 for every operation added here.

## Minimal UI

Compose form + feed with Acknowledge button on IMPORTANT.
