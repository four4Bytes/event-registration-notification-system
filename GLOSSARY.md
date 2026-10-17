# Event Registration and Notification System

A campus event system covering student registration, staff-assisted attendance, configurable approval chains, and in-app notification delivery with optional email fallback.

## Language

**Student**:
A registered person eligible to register for and attend campus events.
_Avoid:_ attendee only as a synonym.

**Officer**:
A built-in login role for event-operating staff, such as notification senders and the Council approval step.
_Avoid:_ Club Officer, club president.

**Administrator**:
A built-in login role for users who operate the system, including user management, reporting, and imports.
_Avoid:_ Admin, DEV.

**Dev**:
A technical support login role with operational access to run and maintain the system. It is not a business role in approvals or reports.
_Avoid:_ superuser concept.

**Attendance Staff** (removed):
A former login role for recording attendance. Removed from the model by ADR-0007: no `ATTENDANCE_STAFF` enum value exists, there is no assignment path and no dropdown entry, and `markAttendance` is held by OFFICER and ADMIN.
_Avoid:_ using it for new assignments.

**Approver**:
A user holding the APPROVER login role. An Approver is a candidate for an approval step; being a candidate is not the same as holding one — see Approval Step Holder.
_Avoid:_ approver type names such as Dean or OSA as roles.

**Club Officer**:
A student club title, not a system user or login role.
_Avoid:_ Officer, Club Officer account, club login.

**Registration**:
One record for one student at one event that persists through repeated registration, cancellation, and repeated registration.
_Avoid:_ attendance record, registration attempt.

**Registration Status**:
Whether a registration is currently `REGISTERED` or `CANCELLED`.
_Avoid:_ seat status, allocation.

**Confirmation Reference**:
The single lifetime credential identifier for a registration.
_Avoid:_ ticket, QR code.

**Capacity Cap**:
The maximum number of currently `REGISTERED` registrations allowed for an event.
_Avoid:_ overbooking, waitlist.

**Eligibility**:
The conditions deciding whether a student may register for a particular event.
_Avoid:_ admission.

**Registration Window**:
The period in which registration may be opened or accepted.
_Avoid:_ enrollment period as a system synonym.

**Cancellation**:
Moving a registration from `REGISTERED` to `CANCELLED`, freeing its slot, refused if an attendance record exists.
_Avoid:_ deletion.

**Re-registration**:
Moving a registration from `CANCELLED` back to `REGISTERED` after a fresh eligibility, registration-window, and capacity check.
_Avoid:_ reopen, retry.

**Audit Entry**:
Immutable history of registration state changes, including actor, time, and old and new state.
_Avoid:_ log, history record.

**Attendance Record**:
One presence record for one student at one event.
_Avoid:_ check-in row, attendance attempt.

**Attendance Status**:
The presence state of an attendance record, `PRESENT`. A present record has `markedPresentAt`; absence is simply the lack of a presence record. A walk-in is a presence row flagged `isWalkIn = true`, audited separately from the registered-presence count and recorded with its own reason by an `OFFICER` or `ADMIN` account. It is NOT authorized through an event approval step — that governs Event publish only.
_Avoid:_ registration status.

**Correction Window (open question)**:
Whether attendance can later be corrected, under whose authority, within what deadline, and with what audit remains unresolved. The current MVP assumption is no corrections.
_Avoid:_ update, edit.

**Walk-in**:
An audited attendance exception for a student who did not register: an `Attendance` row with `isWalkIn = true`, a required reason and the recording actor, counted separately from registered attendance and never consuming capacity.
_Avoid:_ manual attendance, unofficial attendance, a separate walk-in table.

**Important Notice**:
A notification requiring acknowledgment from each recipient.
_Avoid:_ urgent notice, critical notification.

**In-App Read State**:
A recipient state of `UNREAD`, `READ`, or `ACKNOWLEDGED`, where acknowledgment implies read.
_Avoid:_ email delivery status.

**Email Delivery Attempt**:
A separate per-recipient record that starts as `QUEUED` and ends as exactly one of `SENT` or `FAILED`, with reason, attempt count, and timestamps. `SENT` means the SMTP server accepted the message, not that it was delivered.
_Avoid:_ opened, delivered.

**Per-Recipient Delivery Detail**:
Email delivery outcome information disclosed only to administrators.
_Avoid:_ public delivery status.

**Event Lifecycle**:
The ordered state machine `DRAFT → PENDING_APPROVAL → (REVISION_REQUESTED | APPROVED → PUBLISHED | CANCELLED)` that gates registration and attendance access. Only `PUBLISHED` events accept registration, and attendance requires a published event inside its window.
_Avoid:_ event status as free text.

**Approval Step**:
A configured step in the event approval chain, with an office (Council, Dean, OSA, Security), an order position, a condition description, and one or more holder users. There is no role field on the step: a holder may be an Approver, an OFFICER or an ADMIN, only when assigned to that step. Skipping a step is refused.
_Avoid:_ approval stage, review gate.

**Approval Chain**:
The ordered sequence of `ApprovalStep`s per event, where each step must be approved before the next may begin. Council answers change configuration, not code.
_Avoid:_ approval workflow, gate sequence.

**Approval Step Holder**:
A user assigned to act for a specific approval step (the holders recorded on that `ApprovalStep`), set by an Administrator; each reassignment is audited. A holder may be an Approver, an OFFICER or an ADMIN, in every case only when assigned to that step (the Council step's holder is an OFFICER). An ADMIN has no approval power on a step it is not assigned to, and no user may approve an event they created or submitted. The permission check is "is the acting user a holder of the current step". Delegation is Phase 2 (ADR-0007).
_Avoid:_ role alone, permission check alone, Approver as a synonym for holder.

**Revision Requested**:
An event state indicating the author must revise and resubmit before re-submission for approval.

**RA 10173 Compliance**:
Minimum-necessary exposure to personal data: no response or log exposes more personal data than the feature requires; per-recipient email detail is Administrator-only.
_Avoid:_ full-data dumps, unredacted logs.

**Administrator CSV Import**:
A system-administrator–only import of student records from CSV, with no self-service consumer interface.
_Avoid:_ user-self-service CSV upload, mass-import by non-admin roles.

**SMS Mock Seam**:
SMS delivery is out of the MVP; only a mock seam exists for development and testing, with no real gateway integration.
_Avoid:_ production SMS gateway in MVP, real phone numbers in tests.

**Manual Reminders**:
System-supported manual reminder notifications sent outside the automated approval/window flow, built as a checkbox in the notifications ticket (ADR-0007).
_Avoid:_ automated SMS/email reminder sweep as MVP.

**QR Scanning (Phase 2)**:
QR code scanning for check-in is deferred to Phase 2; the in/out presence pair (scan → PRESENT record) will be added after MVP.
_Avoid:_ QR-based attendance in MVP.

**Evaluation Deferred**:
Feature evaluation and effectiveness measurement are deferred to Phase 2 after the core approval chain and registration are stable.
_Avoid:_ performance or satisfaction metrics in MVP.
