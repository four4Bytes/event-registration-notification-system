import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/infra/prisma";

export async function insertAuditLog(payload: Prisma.AuditLogUncheckedCreateInput) {
  return prisma.auditLog.create({ data: payload });
}
