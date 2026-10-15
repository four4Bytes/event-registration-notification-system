# Registration lifecycle and concurrency

A registration is one persistent entity per event and student with status `REGISTERED` or `CANCELLED`, timestamps for registration and cancellation, and one lifetime confirmation reference. Cancellation preserves the row, releases the slot, is refused once an attendance record exists, and a later re-registration turns the same row back to `REGISTERED` after re-running eligibility, registration-window, and capacity checks. Every state change writes an audit entry. Registration and capacity checks complete transactionally, with locking or serializable isolation, to prevent two students both receiving the last seat.

Rejected alternatives include one row per registration attempt and deleting a cancellation to reregister, which would fragment confirmation-reference history or allow stale slot allocation.
