# Roadmap

## Where the project stands

The foundation is working: people sign in with Google, admins manage users and clubs, officers and admins send
announcements, and everyone reads the announcements they are allowed to see.

Event management and registration are the next substantial phase. The database already has event and attendance models,
and the seed script creates sample data, but there are no event routes, actions, permissions, or UI.

## The event phase

The following order is a sensible starting point, not a commitment. Several steps depend on decisions that have not
been made yet.

1. **Decide event permissions.** Define who may read, create, update, and delete events, and whether officers are limited
   to their own club. Record the result in the permission matrix and [RBAC.md](./RBAC.md).
2. **Separate registration from attendance.** Decide whether registration is a new model, an extension of attendance,
   or something else. Registration needs states such as registered, cancelled, waitlisted, checked in, and no-show;
   attendance currently only records a check-in.
3. **Build event management.** Add the feature module, routes, and create/edit/delete UI. Decide how organisation-wide
   events differ from club events.
4. **Build the student view.** Students need to browse upcoming events, open details, register, and cancel. Visibility
   should follow the same role and club rules as notifications.
5. **Build check-in and attendance.** Decide how check-in is captured, where photos are stored, who can verify them, and
   what privacy rules apply.
6. **Connect events to notifications.** Let the composer select an event, or decide that event announcements stay
   manual. Event notifications may eventually target registrants rather than a whole club.
7. **Update tests and documentation.** Cover the new schemas and guards, and update the data model and permission docs.

## Decisions still open

### Who can manage events?

Admins can plausibly manage every event. Officers are less obvious: should they create events only for their own club,
for any club, or also organisation-wide events? The permission matrix already supports a distinction between all records
and the user's own club, but the event policy has not been chosen.

### What is registration?

The existing attendance record answers "who showed up?" Registration also needs "who said they were coming?" and a way
to cancel or waitlist. One model could carry all of those states, or registration and attendance could stay separate.
The choice affects the student UI, capacity handling, and reporting.

### What happens when an event is full?

There is no capacity or waitlist model yet. If events are unlimited, registration can be a simple create/delete. If not,
the system needs a capacity rule, a waitlist order, and a consistent answer for concurrent registrations.

### Can external users register?

External users can sign in when invited and can read notifications in the app, but they do not receive notification
email. The event phase needs to decide whether they can register, whether they receive event email, and what club
membership means for them.

### How should check-in photos work?

Attendance currently requires a photo reference, but there is no upload flow, storage setup, or access control around
it. A real check-in feature needs to decide where files live, who can view them, how long they are kept, and whether a
photo is required.

### Are event notifications automatic?

Event announcements are manual today. An event could send reminders automatically, notify registrants when details
change, or stay entirely in the hands of the organiser. The notification model already allows an event link; the policy
does not exist yet.

## Current limitations

- There is no event management, browsing, registration, or check-in UI.
- Attendance is a check-in record, not an RSVP, and only the seed script creates it.
- Notification email goes only to active school accounts. External users see notifications in the app but not by email.
- The composer cannot attach an event.
- Re-inviting an existing user does not apply the new role, club, or external-email decision to their account.
- Notifications cannot be edited, deleted, scheduled, sent to one person, or delivered as push notifications.
- There is no "mark all as read" action and no notification preference screen.
- There is no user deletion workflow; deactivation is the removal path.
- There is no audit log, application-level rate limiting, or email delivery tracking.
- Email is sent after the database write, so a failed email does not roll back an invitation or notification.

## A reasonable finish line for the event phase

- Admins and permitted officers can create, edit, and delete events.
- Students can browse upcoming events, open details, register, and cancel where allowed.
- Capacity and waitlist rules are applied if those are adopted.
- Attendance can be recorded and reviewed by the people responsible for the event.
- Notifications can be linked to events, and automatic notices can be added if desired.
- New actions are guarded, validated, documented in the permission matrix, and covered by allow/deny tests.
- The relationship between registration and attendance is documented without ambiguity.

None of that exists yet. The current application is the foundation it will build on.
