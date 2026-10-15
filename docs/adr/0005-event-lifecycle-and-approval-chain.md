# Event lifecycle and approval-chain model

Events progress through a seven-state machine: `DRAFT → PENDING_APPROVAL → (REVISION_REQUESTED | APPROVED → PUBLISHED | CANCELLED)`. Only `PUBLISHED` events accept registration, and attendance requires a published event inside its window.

The approval chain is modelled as data through `ApprovalStep` records, one per event type (Council, Dean, OSA, Security), each with an ordinal position, a free-form condition description (pending sign-off: Council final authority; Dean only off-campus or outside-coordination; OSA only school-wide, minors or outside guests; Security above a configurable threshold, demo placeholder 100 participants), and a required role. Skipping a step is refused. Every decision (approve, reject, request revision, delegate) writes an audit entry. The permission check is "has an active ApprovalAuthority for the current step", applicable on an APPROVER user or on an OFFICER for the Council step.

The existing Event CRUD fields are preserved; only the `status` field is added with a default of `DRAFT`. Configuration changes (step order, conditions, required roles) are made by changing `ApprovalStep` records, not by code changes.

Pending sign-off assumptions (not yet ratified):

- Council: final authority; changing Council configuration requires a configuration-change operation, not a code change.
- Dean: only off-campus or outside-coordination events.
- OSA: only school-wide, minors or outside-guest events.
- Security: above a configurable participant threshold; demo placeholder is 100 participants.

Rejected alternatives include hard-coding the chain in route handlers, or modelling each step as a separate ApprovalAuthority without the ApprovalStep intermediate layer.
