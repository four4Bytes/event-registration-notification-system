# MVP Specification: Event Registration and Notification System

## Problem Statement

A campus event system needs to manage student registration, staff-assisted attendance, in-app notifications with acknowledgement, and email delivery as a delivery-only subsystem. The in-app notification state is the source of truth; email is delivery-only with its own state machine. Students acknowledge IMPORTANT notices; the system must refuse suspended/inactive accounts and enforce role gates. Registration is a single lifelong artifact per student per event with confirmation reference, capacity capping, cancellation, and re-registration. An approval chain gates event publish, and per-recipient email detail is administrator-only under RA 10173 minimum-necessary-exposure requirements.

## Existing Repo Building Blocks

- **Google OAuth** with school-domain gate (`@acdeducation.com`), Auth.js v5, NextAuth session
- **User management**: `Role` enum (STUDENT, OFFICER, ADMIN, DEV, APPROVER; `ATTENDANCE_STAFF` deprecated by ADR-0007); `manageUsers` permission = ADMIN | DEV; `sendNotifications` permission = OFFICER | ADMIN | DEV
- **Notification send/feed**: Server Actions in `src/features/notifications/` (`actions.ts` / `mutations.ts` / `queries.ts`), mutations `createNotification` / `markNotificationRead`, queries `getNotificationsForUser` / `getUnreadNotificationsForUser`
- **Attendance unique rule**: `@@unique([eventId, studentId])` one presence record per student per event
- **Prisma models**: User, Club, Event, Attendance, Notification, NotificationRead, PendingRoleAssignment
- **SMTP config**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` from `.env.example` (Mailpit local dev)
- **RBAC**: `can(role, permission)` in `src/lib/security/rbac.ts`; `requireAuth()` / `requirePermission()` guards in `src/lib/security/auth-guards.ts`

## Gaps Relative to the MVP Spec

| Feature | Status | Notes |
|---|---|---|
| Event lifecycle & approval chain | Partial | Event has `DRAFT` status only; no publish gate, no `ApprovalStep` model |
| Registration with confirmation reference | Partial | No `status`, `cancelledAt`, `cancelation` logic, or capacity counting |
| Attendance with walk-in exception | Partial | Unique rule exists but no `PRESENT`/`ABSENT` status, no walk-in reason, no OFFICER/ADMIN recording check |
| In-app notification states UNREAD/READ/ACK | Missing | Schema has reads only; no `ACKNOWLEDGED` state, no per-recipient email delivery rows |
| Email delivery states QUEUED → SENT|FAILED | Missing | No per-recipient delivery attempt table; email conflated with in-app state |
| Approval chain data model | Missing | No `ApprovalStep` model (office + holder users); no publish gate; no audit entries for approval decisions |
| RA 10173 minimum-necessary exposure | Missing | No explicit policy; per-recipient email detail not restricted to administrators |
| Administrator-only CSV import | Missing | No import path; no self-service CSV upload |
| SMS out of MVP | Missing | No gateway integration; mock seam not built |
| Manual reminders | Missing | No reminder notification flow; built as a checkbox in the notifications ticket (ADR-0007) |
| QR scanning / in-out presence | Deferred Phase 2 | Not in MVP; single‑`@@unique` presence rule only |
| Evaluation/deferred metrics | Deferred Phase 2 | No telemetry dashboard or effectiveness measurement |

## User Stories

1. As a STUDENT, I want to register for an event so that I can attend, and I receive a lifelong confirmation reference (QR token) that does not change on cancellation or re-registration.
2. As a STUDENT, I want to cancel my registration so that my seat becomes available for others, but cancellation is refused if I already have an attendance record.
3. As a STUDENT, I want to re-register for an event I previously cancelled, after a fresh eligibility/window/capacity check, preserving the original confirmation reference.
4. As an OFFICER or ADMIN, I want to create an IMPORTANT notification so that each recipient must acknowledge it, and the system tracks in-app state (UNREAD → READ → ACKNOWLEDGED).
5. As a recipient, I want to acknowledge an IMPORTANT notice so that my state changes to ACKNOWLEDGED (which also marks me READ), and I cannot acknowledge a non-IMPORTANT notice.
6. As a SYSTEM, I want to send an email notification per recipient so that the attempt starts as QUEUED and ends as exactly one of SENT or FAILED with reason and attempt count, and email outcome never alters in-app read/acknowledge state.
7. As an ADMIN, I want to view per-recipient email delivery detail so that I can diagnose send failures, but other roles never see this data.
8. As an OFFICER or ADMIN, I want to mark a student PRESENT at an event so that one presence record exists per student per event, and walk-ins are recorded separately with a reason and an audited recording actor.
9. As an ADMIN, I want to approve an event through an ordered approval chain (Council → Dean → OSA → Security) so that only PUBLISHED events accept registration and attendance.
10. As a user with a suspended or inactive account, I am refused on every notification, registration, attendance, and approval operation.
11. As an ADMIN, I want to import student records from CSV so that the system writes audit entries (actor, time, row count, errors) and refuses to overwrite existing records without explicit consent.
12. As a DEV, I want a mock SMS seam so that tests can simulate message sends without contacting a real gateway.
13. As a system, I want to notify club officers on event publish so that each published event triggers an email with event details and a mechanics checklist to the club officer's email address on the `Club` officer-contact field (ADR-0007); email failure never blocks publishing, and the Council can see which officers were sent the email via an admin view.

## Acceptance Criteria (Vitest test targets)

- Registration: one row per (eventId, userId); status REGISTERED/CANCELLED; confirmation reference preserved; capacity cap enforced; cancellation refused if attendance exists; re-registration re-runs eligibility/window/capacity.
- Attendance: `@@unique([eventId, studentId])`; PRESENT record with `markedPresentAt`; walk-in separately audited with reason and authority; never consumes capacity.
- Notification in-app: UNREAD → READ → ACK (ACK only for IMPORTANT; ACK implies read); per-recipient delivery attempt starts QUEUED and ends as exactly one of SENT or FAILED; email outcome never modifies in-app state.
- Approval chain: Event status DRAFT → PENDING_APPROVAL → (REVISION_REQUESTED → APPROVED → PUBLISHED); only PUBLISHED accepts registration; attendance requires published event inside window; permission = "is the acting user a holder of the current ApprovalStep"; every decision writes audit entry; every reassignment of step holders writes an audit entry; skipping step refused.
- Email RA 10173: Per-recipient detail Administrator-only; no response or log exposes more personal data than the feature requires.
- Role gates for registration: STUDENT may register/cancel/re-register; other roles (OFFICER, ADMIN, DEV, APPROVER) are denied on sub-operations.
- Role gates for attendance: OFFICER or ADMIN may mark PRESENT/walk-in; other roles are denied on sub-operations.
- Role gates for notification: AUTHORIZED roles (OFFICER, ADMIN, DEV) may create/acknowledge notifications and send manual reminders; other roles are denied on sub-operations.
- Role gates for approval chain: holders of the current `ApprovalStep` (an APPROVER, or an OFFICER for the Council step) may approve/reject/request revision/publish; other roles are denied on sub-operations.
- Role gates for email: per-recipient delivery detail visible only to ADMIN; other roles are denied on sub-operations.
- Role gates for CSV import: ADMIN may import; other roles are denied.
- Suspended/inactive accounts: refused on every operation.
- On-event-publish email to officers: system sends email with event details and mechanics checklist to club officers on publish; email failure never blocks publishing; Council can view which officers were sent the email via admin log.

## Phase 2 Deferrals (with reasons)

- **Attendance correction framework**: The MVP assumes no corrections; correction authority, deadline, and audit semantics are an open question for Phase 2.
- **QR scanning & in/out presence pair**: QR code scanning and the scan → `PRESENT` record flow are deferred to Phase 2, after the core approval chain and registration are stable.
- **SMS mock seam**: A mock SMS gateway for test simulation is deferred; SMS is out of the MVP entirely.
- **Evaluation & telemetry**: Feature evaluation dashboards and effectiveness metrics are deferred to Phase 2 after core flows are production-stable.
- **Step delegation**: delegated authority for an approval step is Phase 2 (ADR-0007).
- **Email bounce handling**: the `BOUNCED` outcome needs bounce-report webhook infrastructure, so it is out of the MVP (ADR-0007).

## Approval-Chain Conditions (pending sign-off)

- **Council**: final authority; configuration changes require a config-operation, not a code change.
- **Dean**: only off-campus or outside-coordination events.
- **OSA**: only school-wide, minors or outside-guest events.
- **Security**: above a configurable participant threshold; demo placeholder is 100 participants.

## Outstanding Assumptions (pending sign-off)

- Email sender and hosting unconfirmed; SMTP settings use `SMTP_*` names from `.env.example`.
- an approval step's holders are the users set by an Administrator (an `OFFICER` user for the Council step); the permission check is "is the acting user a holder of the current step"; reassigning holders is audited and delegation is Phase 2 (ADR-0007).
- `DEV` is an admin-equivalent support role, not a business role in approvals or reports.
- Council answers change configuration, not code.
- Per-recipient email delivery detail is Administrator-only under RA 10173; other roles see only in-app state.

## Implementation Seams (for test writing)

- `src/lib/security/rbac.ts` — `can(role, permission)` and `requirePermission(permission)` gates; add `markAttendance` for OFFICER/ADMIN; add approval-chain step-holder checks.
- `prisma/schema.prisma` — add `EventStatus` enum, `status` field on Event, `ApprovalStep` model with its holder users; migration added when the owning ticket lands.
- `src/features/notifications/mutations.ts` — `dispatchNotification` author → recipients write; `attemptEmailDelivery` failure isolation.
- `src/lib/messaging/email.ts` — transport seam with default SMTP settings.
- `src/features/notifications/actions.ts` — the send path is separated from the read/acknowledge operations; both are Server Actions (`AGENTS.md:56` prefers Server Actions over new REST endpoints for application data).
- `src/features/notifications/queries.ts` — in-app read/acknowledge with UNREAD/READ/ACKNOWLEDGED states; per-recipient email delivery rows.
- Registration and cancellation seams are owned by Ticket 7 (`docs/tickets/07-registration.md`).

## Out of Scope (MVP Excluded)

- Production SMS gateway integration
- Evaluation dashboards or effectiveness metrics
- Automated reminder sweep logic
- CSV self-service consumer upload
- QR code scanning and check-in flow
- Event correction/revision workflow beyond the REVISION_REQUESTED state
- Corrections to existing attendance records
- Full audit log pipeline beyond per-entity audit entries