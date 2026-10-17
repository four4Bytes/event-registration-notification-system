# Proposed Schema Additions (not applied, no migration)

These schema changes were discussed during the design grill (Step 3) but not applied to the
live `prisma/schema.prisma`. They are recorded here for ticket planning purposes.
**Shape updated by ADR-0007** (simplified roles and approval): no `ApprovalAuthority` model, no
`ATTENDANCE_STAFF` assignment, no `BOUNCED` outcome.

## Changes relative to committed `prisma/schema.prisma`

### 1. New enum: `EventStatus`

```prisma
enum EventStatus {
  DRAFT
  PENDING_APPROVAL
  REVISION_REQUESTED
  REJECTED
  APPROVED
  PUBLISHED
  CANCELLED
}
```

### 2. New model: `ApprovalStep` (with its holder users)

```prisma
enum ApprovalOffice {
  COUNCIL
  DEAN
  OSA
  SECURITY
}

model ApprovalStep {
  id          String         @id @default(cuid())
  office      ApprovalOffice // closed set of offices
  stepOrder   Int            // ordinal position in the chain
  condition   String         // free-form condition description (pending sign-off)
  isMandatory Boolean        @default(true)
  holders     ApprovalStepHolder[]
}

model ApprovalStepHolder {
  id     String       @id @default(cuid())
  stepId String
  step   ApprovalStep @relation(fields: [stepId], references: [id])
  userId String
  user   User         @relation(fields: [userId], references: [id])

  @@unique([stepId, userId])
}
```

An Administrator sets a step's holders and can reassign them at any time; each reassignment writes
an audit entry. The Council step's holder is an OFFICER user.

### 3. Removed by ADR-0007: `ApprovalAuthority`

The single `ApprovalAuthority` model (user + role + scope + delegation refs) is not built. Its job —
"who may act for this step" — is answered by `ApprovalStep` plus its holders. Delegation moves to
Phase 2.

### 4. Modified model: `Event`

Added `status` field:

```prisma
model Event {
  id            String         @id @default(cuid())
  title         String
  description   String?
  venue         String
  startAt       DateTime
  endAt         DateTime?
  clubId        String?
  club          Club?          @relation(fields: [clubId], references: [id])
  createdById   String
  createdBy     User           @relation("EventCreator", fields: [createdById], references: [id])
  createdAt     DateTime       @default(now())
  attendances   Attendance[]
  notifications Notification[]
  status        EventStatus    @default(DRAFT)
}
```

## Pending sign-off assumptions (not yet ratified)

- **Council**: final authority; changing Council configuration requires a configuration-change operation, not a code change.
- **Dean**: only off-campus or outside-coordination events.
- **OSA**: only school-wide, minors or outside-guest events.
- **Security**: above a configurable participant threshold; demo placeholder is 100 participants.
- **Email sender and hosting**: unconfirmed; SMTP settings use `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` from `.env.example`.

## Not applied rationale

These changes were deferred because:

1. The approval-chain integration requires route handlers, audit-entry logic, and UI workflows that
   belong in a dedicated ticket (not a schema-only migration).
2. The `Event` status + publish gate would force rework on the existing `Registration` concurrency
   model before those foundations are settled.
3. Prisma migration would require a data-seed script and migration file, which is a separate
   operational step beyond the design-decision scope.

These are recorded as "not applied, no migration" so that ticket 9 (notification upgrade) and
ticket 5 (approval chain) can reference the settled design intent without assuming the
schema is already live.