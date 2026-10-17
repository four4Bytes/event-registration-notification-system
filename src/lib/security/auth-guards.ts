import { Role } from "@/generated/prisma/browser";
import { auth } from "@/lib/infra/auth";
import { DeactivatedError, ForbiddenError, UnauthorizedError } from "@/lib/security/errors";
import { can, type Permission } from "@/lib/security/rbac";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  clubId: string | null;
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email || !user.name || !user.role) throw new UnauthorizedError();
  if (user.isActive === false) throw new DeactivatedError();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    clubId: user.clubId ?? null,
  };
}

export async function requirePermission(permission: Permission): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!can(user.role, permission)) throw new ForbiddenError();
  return user;
}
