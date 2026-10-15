# Ticket 13 — Manual reminders (OFFICER/ADMIN)

- Needs: 8, 11
- Label: ready-for-agent
- Schema change: no (standalone sends via Ticket 11)

## Scope

Manual reminders to an event's registered students. One actor set: OFFICER/ADMIN per `sendNotifications`.

## Acceptance checkboxes

1. [ ] Reminders go to an event's registered students as standalone sends with their own delivery attempts; failures isolated per recipient.
2. [ ] Only OFFICER/ADMIN may send (the `sendNotifications` permission).
3. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role.

## Guards

As per checkbox 3 for every operation added here.

## Minimal UI

Send Reminder button on the event page.
