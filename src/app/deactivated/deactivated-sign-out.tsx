"use client";

import { useEffect } from "react";

import { clearDeactivatedSessionAction } from "@/features/auth/actions";

export function DeactivatedSignOut() {
  useEffect(() => {
    async function clearSession() {
      await clearDeactivatedSessionAction();
    }
    void clearSession();
  }, []);

  return null;
}
