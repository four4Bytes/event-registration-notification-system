/**
 * The demo accounts created by `prisma/seed.ts`.
 *
 * Shared so the development sign-in list (ADR-0008) offers exactly the seeded
 * accounts, rather than every user in the database.
 *
 * @module lib/infra/demo-accounts
 */

import { Role } from "@/generated/prisma/browser";

export interface DemoAccount {
  email: string;
  name: string;
  role: Role;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: "student@acdeducation.com", name: "Sam Student", role: Role.STUDENT },
  { email: "officer@acdeducation.com", name: "Olive Officer", role: Role.OFFICER },
  { email: "admin@acdeducation.com", name: "Ada Admin", role: Role.ADMIN },
  { email: "approver@acdeducation.com", name: "Pat Approver", role: Role.APPROVER },
  { email: "dev@acdeducation.com", name: "Dev Support", role: Role.DEV },
];
