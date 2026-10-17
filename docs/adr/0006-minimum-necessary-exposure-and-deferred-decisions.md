# Minimum-necessary exposure and deferred decisions

> **Amended by ADR-0007** (simplified roles and approval). Manual reminders are merged into the notifications ticket, `BOUNCED` is removed from the email outcomes, and attendance is recorded by `OFFICER` or `ADMIN` rather than `ATTENDANCE_STAFF`. The body below states the current model.

## RA 10173: minimum-necessary exposure

No response or log output may expose more personal data than the feature requires. Per-recipient email delivery detail is disclosed only to administrators; other roles see only the in-app read/acknowledgment state. Log entries, API responses, and audit records must strip or omit email addresses, personal identifiers, and any data not strictly necessary for the feature's operation.

Rejected alternative: exposing full delivery status (opened/delivered) to all authenticated users, which would violate data-privacy principles and the Administrator-only gate in ADR-0001.

## Administrator-only CSV import with no self-service

CSV import of student records is a privileged operation restricted to the `ADMIN` role — there is no DEV exception. No consumer-facing or self-service upload interface exists in the MVP. The import path writes audit entries (actor, time, row count, errors); existing emails are skipped and reported, and are never changed or overwritten.

Rejected alternative: allowing any authenticated user to import CSV data, which would violate the minimum-necessary-exposure principle and create data-integrity risk.

## SMS out of the MVP (mock seam only)

SMS delivery is not part of the MVP. A mock seam exists for development and testing purposes only, simulating message acceptance without contacting a real gateway. No production SMS integration, no real phone numbers in test data, and no SMS-related fields in the Prisma schema or API responses.

Rejected alternative: including a production SMS gateway in the MVP, which would introduce carrier-dependent failures, phone-number validation complexity, and RA 10173 exposure of personal contact data.

## Manual reminders

Manual reminder notifications may be sent outside the automated approval/window flow, initiated by an `OFFICER`, `ADMIN` or `DEV` (the `sendNotifications` permission) and built as a checkbox in the notifications ticket (ADR-0007). These are not part of the automatic registration-window reminder logic and are tracked as standalone notification sends with their own email delivery attempt.

Rejected alternative: bundling reminder logic into the automatic registration-window flow, which would conflate two distinct responsibilities and complicate the email-failure-isolation model.

## QR scanning and the in/out presence pair deferred to Phase 2

QR code scanning for check-in is deferred to Phase 2. The in/out presence pair (scan event → `PRESENT` record creation, optional later `ABSENT` marking) will be added after MVP, together with the attendance-correction framework. Until then, attendance is recorded manually by an `OFFICER` or `ADMIN` (ADR-0007).

Rejected alternative: adding QR-based check-in to the MVP, which would require camera/permissions UI, gateway integration, and a parallel presence model that conflicts with the single-`@@unique([eventId, studentId])` contract.

## Evaluation deferred

Feature evaluation and effectiveness measurement are deferred to Phase 2, after the core approval chain, registration, and attendance are stable and in production. Metrics such as registration conversion, attendance-taking latency, and notification open rates will be collected via a separate telemetry pipeline.

Rejected alternative: including evaluation dashboards in the MVP, which would prematurely commit to measurement instrumentation before the data model and user flows are settled.
