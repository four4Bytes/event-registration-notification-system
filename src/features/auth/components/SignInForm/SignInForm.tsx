"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/Button/Button";

import styles from "./SignInForm.module.css";

interface SignInFormProps {
  callbackUrl?: string;
  loginHint?: string;
}

export function SignInForm({ callbackUrl = "/notifications", loginHint }: SignInFormProps) {
  const authorizationParams = loginHint
    ? { login_hint: loginHint, prompt: "select_account" }
    : undefined;

  return (
    <div className={styles.form}>
      <Button
        variant="secondary"
        className={styles.button}
        onPress={() => void signIn("google", { callbackUrl }, authorizationParams)}
      >
        <FcGoogle aria-hidden="true" className={styles.icon} />
        Continue with Google
      </Button>
    </div>
  );
}
