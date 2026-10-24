import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { Role } from "@/generated/prisma/browser";
import { getOptionalEnvVar, getRequiredEnvVar } from "@/lib/infra/env";
import { getAuthAdapterClient } from "@/lib/infra/prisma";
import { isAllowedEmail, isSchoolEmail } from "@/lib/security/email-domain";

/**
 * NextAuth configuration (Google OAuth + Prisma adapter + JWT sessions).
 *
 * The `signIn` callback gates access by school-domain email (or an approved
 * external address), bootstrap `DEV_EMAIL`, pending role assignments, and
 * active-user status; the `session` callbacks refresh the database `id`,
 * `role`, `isActive`, and `clubId` onto the JWT and session so deactivated
 * users can be redirected to the notice page without being silently sent to
 * sign-in.
 *
 * Exports the route `handlers`, `signIn`/`signOut` helpers, and the `auth()`
 * session getter.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(getAuthAdapterClient()),
  providers: [
    Google({
      clientId: getRequiredEnvVar("AUTH_GOOGLE_ID"),
      clientSecret: getRequiredEnvVar("AUTH_GOOGLE_SECRET"),
      // Bypasses the OAuthAccountNotLinked block dynamically in both dev and prod environment
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },
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
      const allowExternalEmail =
        existingUser?.allowExternalEmail ?? pending?.allowExternalEmail ?? false;

      if (email !== devEmail && !hasPrivilegedRole && !isAllowedEmail(email, allowExternalEmail)) {
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
              allowExternalEmail: allowExternalEmail && !isSchoolEmail(email),
              clubId: pending?.clubId ?? null,
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

    async jwt({ token }) {
      if (!token.email) return token;

      const user = await getAuthAdapterClient().user.findUnique({
        where: { email: token.email },
        select: { id: true, role: true, isActive: true, clubId: true },
      });

      if (!user) return null;

      token.id = user.id;
      token.role = user.role;
      token.isActive = user.isActive;
      token.clubId = user.clubId;
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? Role.STUDENT;
        session.user.isActive = token.isActive !== false;
        session.user.clubId = token.clubId ?? null;
      }
      return session;
    },
  },
});
