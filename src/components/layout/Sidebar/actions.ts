"use server";

import { cookies } from "next/headers";

/**
 * Persists the sidebar collapsed state in a long-lived cookie.
 *
 * @param collapsed - Whether the sidebar is collapsed.
 * @returns Resolves after the cookie has been written.
 */
export async function toggleSidebarAction(collapsed: boolean): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("sidebar-collapsed", String(collapsed), {
    path: "/",
    maxAge: 31536000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
