# SDD ledger — plan: Admin brief Phase 2 — People

## Scope

- Extend `/admin/people`; no new route.
- Tabs: Officers, Students, Admins, Pending invitations.
- Add/deactivate/remove Officers; remove = demote to Student.
- Set/replace/remove President through the existing row action.
- Position pill beside Officer role.
- Invitations keep applying role and position on first sign-in.
- No schema, auth, or data changes.

## Rulings

- Ruling: Admins tab added — user confirmed it preserves last-Admin management and the approved spec's full role management — cost if wrong: one extra tab.
- Ruling: Remove Officer demotes to Student — user confirmed the app has no delete-user workflow and history must stay — cost if wrong: role change instead of account removal.

## Tasks

- [x] Tab filter helper + tests (`people-tabs.test.ts`, 7 tests)
- [x] People UI tabs, officer actions, position pill
- [x] Guard regression tests (`actions.test.ts`, 7 tests)
- [x] Verification and click-through

## Verification

- `pnpm test`: 20 files / 276 tests pass.
- `pnpm lint`: clean.
- `pnpm exec tsc --noEmit`: clean.
- `pnpm build`: passes; `/admin/people` is dynamic.
- Authenticated Playwright check with minted NextAuth cookies:
  - Admin sees Officers, Students, Admins, Pending invitations.
  - Officers tab excludes students; Students tab excludes officers.
  - Admins tab shows Admin and DEV accounts.
  - Remove officer confirmation explains demotion to Student.
  - Set position row action opens the position form.
  - Add officer defaults the role to Officer.
  - Student and Officer redirect to `/access-denied`.
  - No browser console errors.

## Notes

- No President is seeded, so the President pill was code-verified only; the page rendered the
  "No President appointed" state instead.
- `remove officer` and `set position` dialogs were opened and cancelled in the click-through; no data was mutated.
- No schema, auth, or data changes.
- Phase 2 complete; awaiting explicit Phase 3 approval. Nothing committed.
