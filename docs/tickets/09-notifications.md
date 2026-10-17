# Ticket 9 — Notifications: staff send, students acknowledge IMPORTANT, manual reminders

- Needs: 2, 3, 7
- Label: ready-for-agent
- Schema change: yes (per-recipient in-app rows + email delivery rows)

## Scope

Staff (OFFICER, ADMIN, DEV) send; STUDENTS acknowledge IMPORTANT notices. Manual reminders are the same mechanism applied to an event's registered students, built here rather than in a separate ticket (ADR-0007). Current send-after-commit behavior is changed.

## Acceptance checkboxes

1. [ ] Per-recipient in-app rows with UNREAD/READ/ACKNOWLEDGED; ACK only for IMPORTANT, ACK implies read.
2. [ ] A delivery attempt starts as QUEUED and ends as exactly one of SENT or FAILED (no BOUNCED — ADR-0007); SENT means SMTP acceptance only.
3. [ ] In-app row written first and survives email failure; email outcome never alters in-app state.
4. [ ] Manual reminders go to an event's registered students as standalone sends with their own delivery attempts; failures isolated per recipient; only OFFICER, ADMIN or DEV may send (the `sendNotifications` permission).
5. [ ] Per-recipient detail Administrator-only (RA 10173); authentication, suspended/inactive refusal, and a role gate tested for each denied role.

## Guards

As per checkbox 5 for every operation added here.

## Minimal UI

Compose form + feed with Acknowledge button on IMPORTANT + Send Reminder button on the event page.
