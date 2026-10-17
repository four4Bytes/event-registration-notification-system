# Notification in-app truth and email delivery

In-app read and acknowledgment state is the source of truth for a notification. A separate per-recipient email delivery attempt records one outcome from `{QUEUED, SENT, FAILED}`, with reason, attempt count, and timestamps (`BOUNCED` is removed by ADR-0007: it needed a bounce-report webhook the MVP does not have, so it was unreachable). These outcomes are alternative, not a linear chain: `QUEUED` means the message has not yet been submitted to SMTP; `SENT` means the SMTP server accepted the message (acceptance does not equal delivery); `FAILED` means a send-time error. Email send success means SMTP acceptance only. Failed email does not alter in-app state, and per-recipient delivery details are available only to administrators.

Rejected alternatives include a single combined notification status and treating email acceptance as delivery or read confirmation.
