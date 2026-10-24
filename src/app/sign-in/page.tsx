import Image from "next/image";

import { SignInForm } from "@/features/auth/components/SignInForm/SignInForm";
import { getDevSignInAccounts } from "@/features/users/queries";
import { isDevLoginEnabled } from "@/lib/infra/dev-auth";

import styles from "./page.module.css";

export default async function SignInPage() {
  const devUsers = isDevLoginEnabled() ? await getDevSignInAccounts() : [];

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image
          src="/school-logo.svg"
          alt="School logo"
          width={120}
          height={120}
          className={styles.brandMark}
          priority
        />
        <h1 className={styles.greetings}>Welcome to Event Registration & Notification</h1>
        <p className={styles.description}>Sign in with your school Google account</p>
        <SignInForm />
        <p className={styles.note}>Need access? Contact your school administrator</p>
      </section>
    </main>
  );
}
