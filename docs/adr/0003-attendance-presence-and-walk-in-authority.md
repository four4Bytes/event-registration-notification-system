# Attendance presence and walk-in authority

Attendance is one presence record per event and student, with status `PRESENT` (having `markedPresentAt`). Absence is simply the lack of a presence record — there is no `ABSENT` row. A walk-in is a separate, audited exception that never consumes registration capacity, is counted separately, and carries its own reason and authorization through an active `ApprovalAuthority`. The approved walk-in is audited separately from presence; presence alone does not imply approval. Walk-ins do not become registrations and do not reduce the capacity cap. The MVP assumption remains no corrections, while correction authority, deadline, and audit semantics remain an open question.

Rejected alternatives include a separate walk-in table causing parallel presence records, or allowing walk-ins without active authority, or modelling absence as an `ABSENT` row within the presence table.
