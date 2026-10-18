import { insertAuditLog } from "@/features/audit/mutations";
import type { AuditLog } from "@/generated/prisma/browser";
import type { Prisma } from "@/generated/prisma/client";
import { requireAuth } from "@/lib/security/auth-guards";

export type AuditEntryPayload = Pick<AuditLog, "entityType" | "entityId" | "action"> & {
  previousState?: Prisma.InputJsonValue;
  newState?: Prisma.InputJsonValue;
};

export async function writeAuditLog(payload: AuditEntryPayload) {
  const { entityType, entityId, action, previousState = null, newState = null } = payload;
  const actor = await requireAuth();

  return insertAuditLog({
    entityType,
    entityId,
    action,
    actorId: actor.id,
    actorRole: actor.role,
    details: { previousState, newState },
  });
}
