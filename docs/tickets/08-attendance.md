# Ticket 8 — Attendance presence, walk-ins, audit and counting

- Needs: 7
- Label: ready-for-agent
- Schema change: yes (Attendance presence + walk-in flag fields, one migration)

## Scope

Single presence record per student per event; walk-ins are flagged attendance rows for unregistered students. Presence and walk-ins share one table and one migration (merged by ADR-0007). Recorded by OFFICER or ADMIN (ADR-0007 dropped `ATTENDANCE_STAFF`).

## Acceptance checkboxes

1. [ ] `@@unique([eventId, studentId])` kept; PRESENT rows with `markedPresentAt`; absence is the lack of a row.
2. [ ] Walk-ins are flagged attendance rows (`attendanceType: REGULAR|WALK_IN`) for students without a registration: never consume capacity, counted separately, require a reason and a recording actor, and each writes an audit entry.
3. [ ] Only REGISTERED students get REGULAR rows.
4. [ ] Settle what happens when a walk-in student later registers or is already registered, so the `(eventId, studentId)` unique rule never breaks; record the walk-in table-versus-flag choice as a decision made in this ticket.
5. [ ] Walk-ins counted separately from registered attendance in queries.
6. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role (OFFICER/ADMIN mark PRESENT and walk-ins; students view their own).

## Guards

As per checkbox 6 for every operation added here.

## Minimal UI

Attendance list with PRESENT marking + walk-in form (reason field) + separately-counted walk-in list.
