# Notification in-app truth and email delivery

> **Amended by ADR-0007** (simplified roles and approval). The `BOUNCED` outcome is removed. The body below states the current model.

In-app read and acknowledgment state is the source of truth for a notification. A separate per-recipient email delivery attempt starts as `QUEUED` and ends as exactly one of `SENT` or `FAILED`, with reason, attempt count, and timestamps. `SENT` means the SMTP server accepted the message (acceptance does not equal delivery); `FAILED` means a send-time error. Email send success means SMTP acceptance only. Failed email does not alter in-app state, and per-recipient delivery details are available only to administrators.

Rejected alternatives include a single combined notification status and treating email acceptance as delivery or read confirmation.
