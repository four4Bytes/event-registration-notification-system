# Overview

## A notification-first system, with events still ahead

The Event Registration & Notification System is a web application for a school community. Its long-term purpose is to
let clubs and the student council publish events, let students register, and keep everyone informed through
notifications. The current application has built the foundation around that idea: identity, roles, clubs, and
announcements. Event management and registration are still to come.

The order was intentional. Before someone can create an event, the system needs to know who they are and what they may
do. Before a notification can reach the right people, it needs to know who belongs to which club. Those foundations now
work end to end. The event layer is the next substantial phase.

## Who uses it

There are four account roles. Three are part of the normal workflow; the fourth exists for setup and maintenance.

| Role        | Who they are                                     | What they can do today                                               |
| ----------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| **Student** | A regular member of the school community.        | Read organisation-wide announcements and their club's announcements. |
| **Officer** | A student leader, usually in charge of a club.   | Do everything a student can, and send notifications.                 |
| **Admin**   | School staff or a trusted administrator.         | Manage users, invitations, roles, clubs, and every notification.     |
| **Dev**     | A temporary bootstrap account used during setup. | Full access. It cannot be invited and its role cannot be changed.    |

Permissions are not a simple role hierarchy. Every capability is looked up in one central matrix, documented in
[RBAC.md](./RBAC.md). When a new feature needs a rule, that matrix is the place to change it.

## What works today

### Sign-in and invitations

People sign in with Google; the application does not store passwords. School accounts use the `@acdeducation.com` or
`@acd.edu.ph` domain. New external Google accounts are accepted only when an administrator has invited that address and
approved external email.

There is no open registration form. A first-time user needs a school address, the configured developer email, or a
pending invitation. An invitation carries the role and optional club the person should receive. Those values are applied
when the account is created on first sign-in, and the invitation is then consumed.

Access failures land on clear notice pages rather than generic errors: sign-in required, email domain not allowed, account
deactivated, access denied, or access changed after a role update. [AUTH-AND-ACCESS.md](./AUTH-AND-ACCESS.md) covers the
full flow.

### Notifications

Every signed-in user has a feed of announcements they are allowed to see. A notification can be addressed to everyone in
the organisation or to one club. Opening it marks it as read, and the sidebar shows an unread count.

Officers and admins can compose a notification with a title and body, choose the audience, and send it. It appears in
the feed immediately and is emailed to the matching active school accounts. The composer does not attach events,
schedule delivery, or target individual users yet. [NOTIFICATIONS.md](./NOTIFICATIONS.md) describes the behaviour and
the current email rule.

### Users and clubs

Administrators have one **Manage Users** table that mixes existing accounts and pending invitations. From there they can
invite someone, change a role, assign or clear a club, deactivate or reactivate an account, and cancel an invitation.

The same area protects the system from locking itself out. The last active admin or developer cannot be demoted or
deactivated, the developer role cannot be assigned through the normal editor, and an admin who changes their own access
is taken to a notice page instead of being left on a page they can no longer use.

Clubs are the scoping unit for users and club notifications. Administrators can create, rename, and delete them. Club
names and short names are unique regardless of letter case, and a club cannot be deleted while members, events, or
notifications still use it.

## Two ideas that shape the system

### Organisation-wide versus club-scoped

A notification is addressed either to everyone or to one club. Admins and developers can see every notification.
Officers and students see organisation-wide announcements plus those for their own club. A user with no club sees only
organisation-wide announcements.

A person belongs to at most one club. That keeps the current model simple and is why there is no separate membership
table yet.

### Invitations are the front door

A pending invitation represents a decision made before the person signs in: this email, this role, this club, and
whether external access is allowed. School addresses are trusted by domain. External addresses need that explicit
approval. Cancelling an invitation removes the pending record, so a new account cannot be created through it.

This is also why re-inviting an existing user does not change their access; the pending record is only consumed when a
new account is created. See [ROADMAP.md](./ROADMAP.md).

## The current boundary: events

The database contains `Event` and `Attendance` models, and the seed script creates sample data. There are no event
pages, actions, schemas, permissions, or registration flow yet.

`Attendance` is a check-in record with a photo, not an RSVP or registration. A student cannot browse events, register,
cancel, or check in through the application today. The notification composer can announce an event, but it cannot link
the notification to the event record; that field is reserved for the next phase.

[ROADMAP.md](./ROADMAP.md) describes the decisions that phase still needs.

## Where to go next

For local setup, continue with [SETUP.md](./SETUP.md). For the code structure, read
[ARCHITECTURE.md](./ARCHITECTURE.md). For exact permissions, use [RBAC.md](./RBAC.md) together with
[AUTH-AND-ACCESS.md](./AUTH-AND-ACCESS.md).
