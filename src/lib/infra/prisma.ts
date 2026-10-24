import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getRequiredEnvVar } from "@/lib/infra/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: getRequiredEnvVar("DATABASE_URL") }),
  });
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());
    return Reflect.get(client, property, receiver);
  },
});

/**
 * Returns the shared Prisma client for the NextAuth Prisma adapter.
 *
 * @returns The singleton {@link prisma} client.
 */
export function getAuthAdapterClient(): PrismaClient {
  return prisma;
}
