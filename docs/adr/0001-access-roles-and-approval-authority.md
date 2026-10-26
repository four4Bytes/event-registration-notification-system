# Access roles and approval authority

> **Amended by ADR-0007** (simplified roles and approval). `ATTENDANCE_STAFF` is dropped from the model, and `ApprovalAuthority` is replaced by an `ApprovalStep` that stores its holder users. `APPROVER` remains the only added login role. The body below states the current model.

Business login roles are STUDENT, OFFICER, ADMIN, DEV and APPROVER. Club Officers are never users; their participation is recorded as request context. Council, Dean, OSA, Security and similar approval functions are represented as data through one `ApprovalStep` per office, each carrying the user(s) who hold it, rather than as additional login roles. The role check establishes that a user may act at all; the operational approval check is whether the acting user is a holder of the current step.

`ATTENDANCE_STAFF` was added by an earlier decision and is now **removed**: ADR-0007 dropped it while the addition was still unpushed, so the migration adds only `APPROVER`, there is no assignment path and no dropdown entry, and `markAttendance` is held by OFFICER and ADMIN (ADR-0007).

DEV remains an administrative support role for operation and maintenance, not a business approval role. Permission map: `manageUsers` is ADMIN or DEV; `sendNotifications` is OFFICER, ADMIN or DEV; `markAttendance` is OFFICER or ADMIN.

Relevant settled positions: Club Officer has no login; an Approver is a user holding the APPROVER role; only one Role can be held by one user because the enum allows one role per user.

Rejected alternatives: a login role per approval office (Dean, OSA, Security), which would multiply roles for data that belongs in `ApprovalStep`.
