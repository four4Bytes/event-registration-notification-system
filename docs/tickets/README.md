# Ticket index

16 tickets. Council = an OFFICER holding an active ApprovalAuthority with `authorityScope: "Council"` (no new role). No separate student-profile ticket: the profile already exists (`User` name/email/image/clubId/role + Google login + `Club.members`), covered by Tickets 2 (roles), 7 (audience includes them), 14 (account creation).

## Dependency table

| Ticket | Needs | Schema | Label |
|---|---|---|---|
| 1 test setup | — | no | ready-for-agent |
| 2 roles + permission map | 1 | **yes** | ready-for-agent |
| 3 audit log | 1 | **yes** | ready-for-agent |
| 4 event status + publish | 2, 3 | **yes** | pending sign-off |
| 5 approval chain | 4 | **yes** | pending sign-off |
| 6 delegation | 5 | no | pending sign-off |
| 7 eligibility + fields | 2, 4 | **yes** | ready-for-agent |
| 8 registration | 4, 7 | **yes** | ready-for-agent |
| 9 attendance presence | 8 | **yes** | ready-for-agent |
| 10 walk-in audit/counting | 9 | no | ready-for-agent |
| 11 notifications | 2, 3 | **yes** | ready-for-agent |
| 12 officer contacts | 4, 11 | **yes** | pending sign-off |
| 13 manual reminders | 8, 11 | no | ready-for-agent |
| 14 CSV import | 2, 3 | no | ready-for-agent |
| 15 reports | 5, 8, 9, 10, 11 | no | ready-for-agent |
| 16 REST + OpenAPI | 1–15 | no | ready-for-agent |

## Serialized schema order (one migration at a time, numeric)

**2 → 3 → 4 → 5 → 7 → 8 → 9 → 11 → 12**

## Overlap groups (only no-schema tickets may overlap)

- **14** (needs 2, 3): may overlap with the 4–12 window — touches only User/PendingRoleAssignment reads + AuditLog writes.
- **6** (needs 5): may overlap with 7 — delegation logic vs Event fields, different tables.
- **10** (needs 9): may overlap with 11, 12 — counting/audit/UI vs notification and club-metadata work.
- **13** (needs 8, 11): may overlap with 12, 14 — reminder sends vs contacts/import.
- **15** (needs 5, 8, 9, 10, 11): may overlap with 12, 13, 14 once its deps land — queries only.
- **16** overlaps with nothing (needs all features).
