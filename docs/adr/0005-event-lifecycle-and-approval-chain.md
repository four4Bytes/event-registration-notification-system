# Event lifecycle and approval-chain model

> **Amended by ADR-0007** (simplified roles and approval). `ApprovalAuthority` and its delegation references are replaced by one `ApprovalStep` that stores the office and the user(s) holding it; delegation moves to Phase 2. The body below states the current model.

Events progress through a seven-state machine — `DRAFT`, `PENDING_APPROVAL`, `REVISION_REQUESTED`, `REJECTED`, `APPROVED`, `PUBLISHED`, `CANCELLED` — with the transitions `DRAFT → PENDING_APPROVAL`, `PENDING_APPROVAL → APPROVED`, `APPROVED → PUBLISHED`, `PENDING_APPROVAL → REVISION_REQUESTED → PENDING_APPROVAL` for a resubmission, `PENDING_APPROVAL → REJECTED`, and `→ CANCELLED` from every state except the two terminal ones (`REJECTED`, `CANCELLED`). Only `PUBLISHED` events accept registration, and attendance requires a published event inside its window.

The approval chain is modelled as data through `ApprovalStep` records, one per office (Council, Dean, OSA, Security), each with an ordinal position, a free-form condition description (pending sign-off: Council final authority; Dean only off-campus or outside-coordination; OSA only school-wide, minors or outside guests; Security above a configurable threshold, demo placeholder 100 participants), and one or more holder users — there is no required-role field. An Administrator sets and may reassign a step's holders at any time. Skipping a step is refused. Every decision (approve, reject, request revision) writes an audit entry, and every reassignment of a step's holders writes an audit entry. The permission check is "is the acting user a holder of the current step"; an OFFICER user holds the Council step. A holder may be an APPROVER, an OFFICER or an ADMIN, in every case only when an Administrator has assigned them to that step; an ADMIN has no approval power on a step it is not assigned to, and no user may approve an event they created or submitted (ADR-0007 §8).

The existing Event CRUD fields are preserved; only the `status` field is added with a default of `DRAFT`. Configuration changes (step order, conditions, holders) are made by changing `ApprovalStep` records, not by code changes.

Pending sign-off assumptions (not yet ratified):

- Council: final authority; changing Council configuration requires a configuration-change operation, not a code change.
- Dean: only off-campus or outside-coordination events.
- OSA: only school-wide, minors or outside-guest events.
- Security: above a configurable participant threshold; demo placeholder is 100 participants.

Rejected alternatives include hard-coding the chain in route handlers, and modelling the chain through a separate `ApprovalAuthority` assignment layer with delegation references, which ADR-0007 replaced with `ApprovalStep` plus its holders.
