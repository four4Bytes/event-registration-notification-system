/** Domains used by school-issued email addresses. */
export const SCHOOL_EMAIL_DOMAINS = ["@acdeducation.com", "@acd.edu.ph"] as const;

/** Human-readable list of the approved school domains. */
export const SCHOOL_EMAIL_DOMAINS_TEXT = SCHOOL_EMAIL_DOMAINS.join(", ");

/** User-facing message for an unapproved external email. */
export const SCHOOL_EMAIL_REQUIRED_MESSAGE = `Email must end in ${SCHOOL_EMAIL_DOMAINS_TEXT} unless an external email is allowed`;

/**
 * Checks whether an email address belongs to an approved school domain.
 *
 * @param email - The email address to evaluate.
 * @returns `true` when the trimmed, lowercased address ends with one of
 *          {@link SCHOOL_EMAIL_DOMAINS}.
 */
export function isSchoolEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return SCHOOL_EMAIL_DOMAINS.some((domain) => normalized.endsWith(domain));
}

/**
 * Checks whether an email may be used for an invitation.
 *
 * @param email - The email address to evaluate.
 * @param allowExternalEmail - Whether an explicitly approved external address
 *                             is allowed.
 * @returns `true` for school emails and approved external emails.
 */
export function isAllowedEmail(email: string, allowExternalEmail: boolean): boolean {
  return allowExternalEmail || isSchoolEmail(email);
}
