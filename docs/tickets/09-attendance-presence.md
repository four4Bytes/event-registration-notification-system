# Ticket 9 — Attendance presence, REGISTERED students only

- Needs: 8
- Label: ready-for-agent
- Schema change: yes (Attendance presence fields)

## Scope

Single presence record per student per event. Walk-ins are flagged attendance rows for unregistered students.

## Acceptance checkboxes

1. [ ] `@@unique([eventId, studentId])` kept; PRESENT rows with `markedPresentAt`; absence is the lack of a row.
2. [ ] Walk-ins are flagged attendance rows (`attendanceType: REGULAR|WALK_IN`) for students without registration: never consume capacity, counted separately.
3. [ ] Only REGISTERED students get REGULAR rows.
4. [ ] Settle what happens when a walk-in student later registers or is already registered, so the `(eventId, studentId)` unique rule never breaks; record the walk-in table-versus-flag choice as a decision made in this ticket.
5. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role (ATTENDANCE_STAFF marks; students view own).

## Guards

As per checkbox 5 for every operation added here.

## Minimal UI

Attendance list with PRESENT marking.
