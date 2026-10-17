# Ticket index

The 20 settled decisions behind this plan live in `docs/DECISIONS.md`, each linked to its ADR and its ticket.

12 tickets. Council = a holder of the Council approval step (no role beyond `APPROVER`). No separate student-profile ticket: the profile already exists (`User` name/email/image/clubId/role + Google login + `Club.members`), covered by Tickets 2 (roles), 6 (audience includes them), 11 (account creation).

ADR-0007 simplified roles and approval: `ATTENDANCE_STAFF` is dropped (deprecated enum value, no assignment path), `markAttendance` = OFFICER|ADMIN; `ApprovalAuthority` and delegation are replaced by one `ApprovalStep` with its holder users; `BOUNCED` is removed; manual reminders merged into Ticket 9; officer contacts are a `Club` field; attendance and walk-ins merged into Ticket 8; the REST/OpenAPI ticket is dropped.

## Dependency table

| Ticket                      | Needs      | Schema  | Label                                                                                       |
| --------------------------- | ---------- | ------- | ------------------------------------------------------------------------------------------- |
| 1 test setup                | —          | no      | ready-for-agent (committed `c48b5ef`)                                                       |
| 2 roles + permission map    | 1          | **yes** | ready-for-agent (committed `25078a9`; ADR-0007 follow-up outstanding, listed in the ticket) |
| 3 audit log                 | 1          | **yes** | ready-for-agent                                                                             |
| 4 event status + publish    | 2, 3       | **yes** | built on assumptions, pending sign-off                                                      |
| 5 approval chain            | 4          | **yes** | built on assumptions, pending sign-off                                                      |
| 6 eligibility + fields      | 2, 4       | **yes** | ready-for-agent                                                                             |
| 7 registration              | 4, 6       | **yes** | ready-for-agent                                                                             |
| 8 attendance + walk-ins     | 7          | **yes** | ready-for-agent                                                                             |
| 9 notifications + reminders | 2, 3, 7    | **yes** | ready-for-agent                                                                             |
| 10 officer contacts         | 4, 9       | **yes** | built on assumptions, pending sign-off                                                      |
| 11 CSV import               | 2, 3       | no      | ready-for-agent                                                                             |
| 12 reports                  | 5, 7, 8, 9 | no      | ready-for-agent                                                                             |

## Serialized schema order (one migration at a time, numeric)

**3 → 4 → 5 → 6 → 7 → 8 → 9 → 10** (Ticket 2 is already applied; its ADR-0007 correction is code only, no migration.)

## Overlap groups (only no-schema tickets may overlap)

- **11** (needs 2, 3): may overlap with the 4–10 window — touches only User/PendingRoleAssignment reads + AuditLog writes.
- **12** (needs 5, 7, 8, 9): may overlap with 10, 11 once its dependencies land — queries only.

## Merged or dropped by ADR-0007

| Former ticket                   | Now                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| 6 delegation                    | Phase 2                                                                                 |
| 9 presence + 10 walk-ins        | Ticket 8, one migration                                                                 |
| 13 manual reminders             | Ticket 9, checkbox 4                                                                    |
| 12 officer contacts (own model) | Ticket 10, a `Club` field                                                               |
| 16 REST + OpenAPI               | dropped (`AGENTS.md:56` prefers Server Actions; the per-route 401/403 tests go with it) |

## Phase 2

- Step delegation (former Ticket 6).
- Email bounce handling and the `BOUNCED` outcome (needs webhook infrastructure).
- Any REST/OpenAPI surface (dropped; reverses on an explicit requirement).
- QR scanning and the in/out presence pair, attendance corrections, SMS mock seam, automated reminder sweep, evaluation metrics.
