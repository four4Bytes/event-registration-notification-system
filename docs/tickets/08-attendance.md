# Ticket 8 — Attendance presence, walk-ins, audit and counting

- Needs: 7
- Label: ready-for-agent
- Schema change: yes (Attendance presence + walk-in flag fields, one migration)

## Scope

Single presence record per student per event; walk-ins are `Attendance` rows with `isWalkIn = true` for students who did not register. Presence and walk-ins share one table and one migration (merged by ADR-0007; the separate walk-in table is rejected by ADR-0003). Recorded by OFFICER or ADMIN (ADR-0007 dropped `ATTENDANCE_STAFF`).

## Acceptance checkboxes

1. [ ] `@@unique([eventId, studentId])` kept; PRESENT rows with `markedPresentAt`; absence is the lack of a row.
2. [ ] A walk-in is an `Attendance` row with `isWalkIn = true` for a student without a registration: never consumes capacity, counted separately, requires a reason and a recording actor, is audited separately from presence, and each writes an audit entry.
3. [ ] Only REGISTERED students get REGULAR rows.
4. [ ] A student who already has an attendance row for the event cannot register or re-register, so the `(eventId, studentId)` unique rule never breaks (ADR-0003).
5. [ ] Walk-ins counted separately from registered attendance in queries.
6. [ ] Authentication, suspended/inactive refusal, and a role gate tested for each denied role (OFFICER/ADMIN mark PRESENT and walk-ins; students view their own).

## Guards

As per checkbox 6 for every operation added here.

## Minimal UI

Attendance list with PRESENT marking + walk-in form (reason field) + separately-counted walk-in list.
