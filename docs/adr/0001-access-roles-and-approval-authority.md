# Access roles and approval authority

> **Superseded in part by ADR-0007** (simplified roles and approval). Changed: `ATTENDANCE_STAFF` is dropped from the model (deprecated, unused; `markAttendance` = OFFICER|ADMIN) and `ApprovalAuthority` is replaced by an `ApprovalStep` that stores its holder users. `APPROVER` remains the only new role, and every guard here stays in force.

Keep the existing built-in login roles as business roles: STUDENT, OFFICER, ADMIN, and DEV. Add exactly two login roles: ATTENDANCE_STAFF and APPROVER. Club Officers are never users; their participation is recorded as request context. Council, Dean, OSA, Security, and similar approval functions are represented as data through ApprovalAuthority records assigned to an OFFICER or APPROVER user, rather than as additional login roles. The role check establishes candidate status; the operational approval check is whether the user has the active ApprovalAuthority required for the step.

DEV remains an administrative support role for operation and maintenance, not a business approval or reporting role. The current permission map is unchanged at baseline: manageUsers is ADMIN or DEV; sendNotifications is OFFICER, ADMIN, or DEV; Attendance Staff may mark attendance in addition to ADMIN.

Relevant settled positions: Club Officer has no login; Approver is an office account (delegation moved to Phase 2 by ADR-0007); only one Role can be held by one user because the enum allows one role per user.
