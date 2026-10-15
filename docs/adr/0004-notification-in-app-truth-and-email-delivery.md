# Notification in-app truth and email delivery

In-app read and acknowledgment state is the source of truth for a notification. A separate per-recipient email delivery attempt records one outcome from `{QUEUED, SENT, FAILED, BOUNCED}`, with reason, attempt count, and timestamps. These outcomes are alternative, not a linear chain: `QUEUED` means the message has not yet been submitted to SMTP; `SENT` means the SMTP server accepted the message (acceptance does not equal delivery); `FAILED` means a send-time error; `BOUNCED` means a later bounce report was received. Email send success means SMTP acceptance only. Failed or bounced email does not alter in-app state, and per-recipient delivery details are available only to administrators.

Rejected alternatives include a single combined notification status and treating email acceptance as delivery or read confirmation.
