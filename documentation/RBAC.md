# Role-Based Access Control (RBAC)

> This document is the human-readable mirror of the security policy in
> [`src/lib/security/rbac.ts`](../src/lib/security/rbac.ts). The two are the single source of truth for authorization and
> must be edited **together** - a cell is `YES` (unrestricted grant), `NO` (denied), or `OWN_CLUB` (granted but scoped to
> the actor's own club). Update the matching capability/visibility entry in code and the cell here in the same change.

## Roles

> **Dev accounts** are temporary and not part of the standard workflow. Admins should remove Dev accounts once initial
> setup is complete. Dev is pinned to **YES** on every row in code and is not listed in the tables below.

```
DEV - initial user

ADMIN
  -> OFFICER (President | plain officer)
    -> STUDENT
```

### Officer position

`Role.OFFICER` is the login role. A club officer may additionally hold the `PRESIDENT` position, and a club has at
most one President. A plain officer has no position. Positions require a club; changing the role away from `OFFICER` or
changing the club clears the position. Positions narrow the Officer column in the tables below; they never widen it.

---

## Access Legend

| Code         | Access Level    | Meaning                                                                                        |
| ------------ | --------------- | ---------------------------------------------------------------------------------------------- |
| **YES**      | Granted         | The role can perform this action everywhere.                                                   |
| **NO**       | Denied          | The role cannot perform this action under any circumstance.                                    |
| **OWN_CLUB** | Granted, scoped | The role can perform this action on organisation-wide rows and rows belonging to its own club. |

**CRUD:**

| Code | Meaning       |
| ---- | ------------- |
| `C`  | Create/Add    |
| `R`  | Read/View     |
| `U`  | Update/Edit   |
| `D`  | Delete/Remove |

---

## Capability Matrix

Capabilities are deny-by-default `entity.action` grants enforced by `requirePermission(...)`. Only implemented
capabilities are listed. A cell is `YES` (unrestricted), `NO` (denied), or `OWN_CLUB` (granted but scoped to the actor's
own club).

### User

> Role assignment and user provisioning are managed here. Users with `CREATE` permission are responsible for adding new
> users.

| Action | Admin | Officer | Student |
| :----- | :---: | :-----: | :-----: |
| CREATE |  YES  |   NO    |   NO    |
| READ   |  YES  |   NO    |   NO    |
| UPDATE |  YES  |   NO    |   NO    |
| DELETE |  YES  |   NO    |   NO    |

### Club

> Admins provision clubs used for club-scoped notifications and user assignment. A club cannot be deleted while members,
> events, or notifications still reference it.

| Action | Admin | Officer | Student |
| :----- | :---: | :-----: | :-----: |
| CREATE |  YES  |   NO    |   NO    |
| READ   |  YES  |   NO    |   NO    |
| UPDATE |  YES  |   NO    |   NO    |
| DELETE |  YES  |   NO    |   NO    |

### Notification

> Sending notifications is a President and Admin capability. Plain officers read notifications only. Every role can read
> notifications; `OWN_CLUB` readers see organisation-wide notifications (`audience = ALL`) plus those addressed to their
> own club (`audience = CLUB`). Club is the only scoping dimension in the system.

| Action | Admin | Officer  | Student  |
| :----- | :---: | :------: | :------: |
| CREATE |  YES  | OWN_CLUB |    NO    |
| READ   |  YES  | OWN_CLUB | OWN_CLUB |

### Officer

> Only Admins appoint, replace, or remove a club President. A replacement clears the previous President and sets the new
> one in a single transaction.

| Action           | Admin | Officer | Student |
| :--------------- | :---: | :-----: | :-----: |
| ASSIGN_PRESIDENT |  YES  |   NO    |   NO    |

### Task

> Presidents assign, reassign, and delete tasks for plain officers of their own club; Admins may do so for any club.
> Assignees read and update their own tasks. `task.assign` also covers reassignment and deletion.

| Action     | Admin | Officer  | Student |
| :--------- | :---: | :------: | :-----: |
| ASSIGN     |  YES  | OWN_CLUB |   NO    |
| READ_CLUB  |  YES  | OWN_CLUB |   NO    |
| READ_OWN   |  NO   |   YES    |   NO    |
| UPDATE_OWN |  NO   |   YES    |   NO    |

### Attendance

> Presidents may scan any event in their club. Plain officers may scan only an event for which they hold an `ATTENDANCE`
> task that is not `DONE`. Admins cannot scan. Attendance capture is not implemented yet; the scan route is gated and
> shows a placeholder.

| Action       | Admin | Officer  | Student |
| :----------- | :---: | :------: | :-----: |
| SCAN         |  NO   | OWN_CLUB |   NO    |
| VIEW_RESULTS |  YES  | OWN_CLUB |   NO    |

---

## Implementation Notes

- Every exported Server Action verifies the session and evaluates its permission(s) at the top of the execution flow via
  `requirePermission(...)` from `src/lib/security/auth-guards.ts`. The guard accepts one or more permissions and
  authorizes when the user holds **at least one**.

- The club options read (`getClubOptionsAction`) is shared by the notification composer (Officers and up) and the
  user-assignment flows (Admins), so it uses the variadic guard: `requirePermission("notification.create",
"user.update")`. It is intentionally **not** gated by `club.read`, which stays management-only so Officers cannot reach
  the Manage Clubs page.

- Client-side checks (e.g. sidebar visibility) are presentation-only and never a security boundary; the server re-checks
  every request.

- Position-aware checks combine the role matrix with the officer position (`canWithPosition`) and, for club-scoped
  actions, re-read the actor's current `role`, `clubId`, and `officerPosition` from the database in
  `requireClubPermission(...)`. A President replaced mid-session is refused on the next action.
