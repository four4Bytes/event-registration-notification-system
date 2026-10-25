"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/Button/Button";

import styles from "./SignInForm.module.css";

export function SignInForm() {
  return (
    <div className={styles.form}>
      <Button
        variant="primary"
        className={styles.button}
        onPress={() => void signIn("google", { callbackUrl: "/dashboard" })}
      >
        <FcGoogle aria-hidden="true" className={styles.icon} />
        Continue with Google
      </Button>
    </div>
  );
}
