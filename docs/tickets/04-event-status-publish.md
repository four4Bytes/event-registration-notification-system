# Ticket 4 — Event status and publish transitions

- Needs: 2, 3
- Label: built on assumptions, pending sign-off
- Schema change: yes (EventStatus enum + Event.status)

## Scope

Event lifecycle with a temporary publish path until the approval chain (Ticket 5) lands.

## Acceptance checkboxes

1. [ ] `EventStatus` enum + `Event.status` defaulting to DRAFT.
2. [ ] Only PUBLISHED accepts registration; attendance requires a published event inside its window.
3. [ ] Transition table enforced (DRAFT→PENDING_APPROVAL→APPROVED→PUBLISHED, with REVISION_REQUESTED/REJECTED/CANCELLED branches); temporary ADMIN/OFFICER publish allowed until Ticket 5 lands.
4. [ ] Each transition writes an audit entry; role gate tested per denied role; suspended/inactive refused.

## Guards

Authentication, suspended/inactive refusal, and a role gate tested for each denied role on every transition added here.

## Minimal UI

Status badge + Publish button on the event page (ADMIN/OFFICER only).

Assumptions: Council-final and conditional-step semantics from the grill, pending sign-off.
