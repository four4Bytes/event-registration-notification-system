import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { getAuthAdapterClient } from "@/features/users/mutations";
import { Role } from "@/generated/prisma/browser";
import { isDevLoginEnabled } from "@/lib/infra/dev-auth";
import { getOptionalEnvVar } from "@/lib/infra/env";
import { getGoogleCredentials } from "@/lib/infra/google-credentials";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/infra/session";

const schoolDomain = "@acdeducation.com";

/**
 * NextAuth configuration (Google OAuth + Prisma adapter + database sessions).
 *
 * The `signIn` callback gates access by school-domain email, bootstrap
 * `DEV_EMAIL`, pending role assignments, and active-user status; the `session`
 * callback projects the database `id`, `role`, `isActive`, and `clubId` onto
 * the session so downstream guards see the verified user.
 *
 * Exports the route `handlers`, `signIn`/`signOut` helpers, and the `auth()`
 * session getter.
 */
const googleCredentials = getGoogleCredentials(isDevLoginEnabled());

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(getAuthAdapterClient()),
  providers: googleCredentials.isConfigured
    ? [
        Google({
          clientId: googleCredentials.clientId,
          clientSecret: googleCredentials.clientSecret,
          // Bypasses the OAuthAccountNotLinked block dynamically in both dev and prod environment
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : [],
  session: {
    strategy: "database",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  // Enable debug only on development
  debug: process.env.NODE_ENV === "development",

  callbacks: {
    async signIn({ user, account, profile }) {
      const emailVerified =
        profile && "email_verified" in profile && profile.email_verified === true;
      if (account?.provider !== "google" || !emailVerified || !user.email) return false;

      const email = user.email.toLowerCase();
      const existingUser = await getAuthAdapterClient().user.findUnique({ where: { email } });
      if (existingUser && !existingUser.isActive) return "/auth/error?error=Deactivated";

      const pending = existingUser
        ? null
        : await getAuthAdapterClient().pendingRoleAssignment.findUnique({
            where: { email },
          });
      const devEmailRaw = getOptionalEnvVar("DEV_EMAIL", "");
      const devEmail = devEmailRaw ? devEmailRaw.toLowerCase() : undefined;
      const hasPrivilegedRole =
        existingUser?.role === Role.OFFICER ||
        existingUser?.role === Role.ADMIN ||
        existingUser?.role === Role.DEV;

      if (email !== devEmail && !hasPrivilegedRole && !email.endsWith(schoolDomain)) {
        return "/auth/error?error=Domain";
      }

      if (!existingUser) {
        const role = devEmail === email ? Role.DEV : (pending?.role ?? Role.STUDENT);
        try {
          await getAuthAdapterClient().user.create({
            data: {
              email,
              name: user.name ?? email,
              image: user.image,
              role,
            },
          });
          if (pending)
            await getAuthAdapterClient().pendingRoleAssignment.delete({ where: { email } });
        } catch (error) {
          const concurrentUser = await getAuthAdapterClient().user.findUnique({
            where: { email },
          });
          if (!concurrentUser) throw error;
        }
      } else {
        await getAuthAdapterClient().user.update({
          where: { id: existingUser.id },
          data: { name: user.name ?? existingUser.name, image: user.image },
        });
      }

      return true;
    },

    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? Role.STUDENT;
        session.user.isActive = user.isActive !== false;
        session.user.clubId = user.clubId ?? null;
      }
      return session;
    },
  },
});
