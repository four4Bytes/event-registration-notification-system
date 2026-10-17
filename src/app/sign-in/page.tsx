import Image from "next/image";
import { Suspense } from "react";

import { SignInForm } from "@/features/auth/components/SignInForm/SignInForm";
import { isDevLoginEnabled } from "@/lib/infra/dev-auth";
import { prisma } from "@/lib/infra/prisma";

import styles from "./page.module.css";

export default async function SignInPage() {
  const devUsers = isDevLoginEnabled()
    ? await prisma.user.findMany({
        select: { email: true, role: true },
        orderBy: { email: "asc" },
      })
    : [];

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image
          src="/school-logo.svg"
          alt="School logo"
          width={100}
          height={100}
          className={styles.brandMark}
          priority
        />
        <p className={styles.title}>Event Registration &amp; Notification System</p>
        <h1 className={styles.greetings}>Welcome back</h1>
        <p className={styles.description}>Sign in with your school account to continue.</p>
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
        <p className={styles.note}>Only @acdeducation.com accounts are accepted.</p>
        {devUsers.length > 0 && (
          <div className={styles.note}>
            <p>Development sign-in (not available in production):</p>
            <ul>
              {devUsers.map((user) => (
                <li key={user.email}>
                  <a href={`/dev-sign-in?email=${user.email}`}>
                    {user.role} — {user.email}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
