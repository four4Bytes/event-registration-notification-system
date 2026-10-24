# Notifications

## What a notification is

A notification is an announcement with a title, a body, and an audience. It records who sent it and when. It may target
a club and may eventually link to an event, though the current composer does not offer the event link.

Each user has their own read receipts, which is how the feed knows what is unread.

## Audience and visibility

The audience decides who a notification is for. The viewer's role and club decide what they can see.

| Audience | Intended recipients           |
| -------- | ----------------------------- |
| Everyone | The whole organisation.       |
| Club     | Members of the selected club. |

Admins and developers can read every notification. Officers and students can read organisation-wide notifications plus
those for their own club. A user with no club sees organisation-wide notifications only.

Admins are not treated as members of every club; they simply have an unrestricted read scope. Club membership is a
single field on the user, so there is no multi-club rule to resolve.

## Sending

Sending requires the notification-create permission. Admins, developers, and officers have it; students do not. The feed
hides the composer from students, and the server enforces the same rule.

The composer asks for a title, a body, and an audience. Choosing a club audience reveals a required club picker;
choosing everyone clears it. The server validates the same rules before writing.

At present an officer can target any club, not only their own. That is the current permission policy, not a UI accident.
If officers should be limited to their own club, the change belongs in the permission matrix and the notification docs
together.

After sending, the notification appears in the feed. Matching recipients are looked up and emailed as a separate step.

## Email delivery

Email is sent through Nodemailer and the configured SMTP server. In local development the defaults point at Mailpit; in
production they point at a real mail service.

Only active school accounts receive notification email. External users can see the notification in the app but do not
receive it by email. A club made up entirely of external accounts can therefore produce an in-app notification with no
email recipients.

Email is not part of the database transaction. The notification is created first and emailed afterwards. If SMTP fails,
the action reports an error but the notification stays in the feed. There is no outbox, retry queue, or delivery
tracking.

The email body is assembled from the notification title and body. Sending is restricted to trusted roles; there is no
separate HTML sanitisation layer.

## The feed

The notification feed is the home screen after sign-in. The first page loads on the server, and the browser fetches more
as the user scrolls.

Notifications are shown newest first. Search runs over title and body, and the status filter can show unread or read
items. Search and filters are applied by the server rather than filtering a fully loaded list in the browser.

Opening a notification shows its details and marks it as read. Read receipts are stored per user and notification, so
opening the same item repeatedly is harmless. The feed updates locally, and the unread count is reduced immediately.

The sidebar badge shows the unread count. It is refreshed periodically, when the tab becomes active again, and after a
notification is marked read. A failed background refresh is ignored and corrected by the next successful refresh or page
load.

## What notifications do not do yet

Notifications cannot be edited, deleted, scheduled, sent to an individual, or delivered as push notifications. There is
no "mark all as read" action and no notification preference screen. The composer cannot attach an event.

These are current boundaries, not hidden features. [ROADMAP.md](./ROADMAP.md) covers the next phase.

## Related

- [DATA-MODEL.md](./DATA-MODEL.md) describes the notification records.
- [RBAC.md](./RBAC.md) contains the exact permissions.
- [AUTH-AND-ACCESS.md](./AUTH-AND-ACCESS.md) explains how roles and clubs shape access.
