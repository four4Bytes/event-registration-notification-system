"use server";

import { auth, signOut } from "@/lib/infra/auth";

/**
 * Signs out a deactivated session so the user is not left in a stale state.
 *
 * @returns Resolves after the session check and any sign-out completes.
 */
export async function clearDeactivatedSessionAction(): Promise<void> {
  const session = await auth();
  if (session?.user?.isActive === false) {
    await signOut({ redirect: false });
  }
}
