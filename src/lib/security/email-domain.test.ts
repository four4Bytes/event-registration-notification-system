import { describe, expect, it } from "vitest";

import { isAllowedEmail, isSchoolEmail } from "./email-domain";

describe("isSchoolEmail", () => {
  it.each([
    { email: "student@acdeducation.com", expected: true },
    { email: "STUDENT@ACDEDUCATION.COM", expected: true },
    { email: "student@acd.edu.ph", expected: true },
    { email: "Student@ACD.EDU.PH", expected: true },
    { email: "student@example.com", expected: false },
    { email: "student@sub.acdeducation.com", expected: false },
    { email: "student@notacd.edu.ph.example.com", expected: false },
    { email: "student@acd.edu.ph.evil.com", expected: false },
  ])("returns $expected for $email", ({ email, expected }) => {
    expect(isSchoolEmail(email)).toBe(expected);
  });
});

describe("isAllowedEmail", () => {
  it.each([
    { email: "student@acdeducation.com", allowExternalEmail: false, expected: true },
    { email: "student@acd.edu.ph", allowExternalEmail: false, expected: true },
    { email: "student@acdeducation.com", allowExternalEmail: true, expected: true },
    { email: "guest@example.com", allowExternalEmail: true, expected: true },
    { email: "guest@example.com", allowExternalEmail: false, expected: false },
  ])(
    "returns $expected for $email with bypass set to $allowExternalEmail",
    ({ email, allowExternalEmail, expected }) => {
      expect(isAllowedEmail(email, allowExternalEmail)).toBe(expected);
    },
  );
});
