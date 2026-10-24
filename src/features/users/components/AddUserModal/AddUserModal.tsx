"use client";

import { useEffect, useState } from "react";
import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button/Button";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Modal } from "@/components/ui/Modal/Modal";
import { Select, SelectItem } from "@/components/ui/Select/Select";
import { TextField } from "@/components/ui/TextField/TextField";
import { getClubOptionsAction } from "@/features/clubs/actions";
import { formatClubLabel, LITS_CLUB_NAME } from "@/features/clubs/constants";
import type { ClubOption } from "@/features/clubs/queries";
import { addPendingUserAction } from "@/features/users/actions";
import { AddPendingUserSchema, type AddPendingUserPayload } from "@/features/users/schemas";
import { Role } from "@/generated/prisma/browser";
import { toastError } from "@/lib/hooks/toast-utils";
import { useModalForm } from "@/lib/hooks/useModalForm";
import {
  isAllowedEmail,
  SCHOOL_EMAIL_DOMAINS_TEXT,
  SCHOOL_EMAIL_REQUIRED_MESSAGE,
} from "@/lib/security/email-domain";
import { createFieldValidator, requiredString } from "@/lib/validation/form-utils";

import styles from "./AddUserModal.module.css";

type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

const NO_CLUB = "none";
const validateEmailFormat = createFieldValidator(AddPendingUserSchema.shape.email);

interface AddUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export function AddUserModal({ isOpen, onOpenChange, onSuccess }: AddUserModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>(Role.STUDENT);
  const [clubId, setClubId] = useState<string | null>(null);
  const [allowExternalEmail, setAllowExternalEmail] = useState(false);
  const [clubs, setClubs] = useState<ClubOption[]>([]);

  const reset = () => {
    setEmail("");
    setRole(Role.STUDENT);
    setClubId(null);
    setAllowExternalEmail(false);
  };

  const { isPending, submitForm, handleCancel } = useModalForm<AddPendingUserPayload>({
    submit: addPendingUserAction,
    onOpenChange,
    onSuccess,
    reset,
    successMessage: "User added",
    successDescription: "The invitation has been sent to the provided email address.",
    failureMessage: "Failed to add user",
    schema: AddPendingUserSchema,
  });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    async function loadClubs() {
      try {
        const rows = await getClubOptionsAction();
        if (cancelled) return;
        setClubs(rows);
        setClubId(
          (current) => current ?? rows.find((club) => club.name === LITS_CLUB_NAME)?.id ?? null,
        );
      } catch {
        if (!cancelled) {
          toastError(
            "Failed to load clubs",
            "We couldn't retrieve the club list. Please try again.",
          );
          onOpenChange(false);
        }
      }
    }
    void loadClubs();
    return () => {
      cancelled = true;
    };
  }, [isOpen, onOpenChange]);

  function validateEmail(value: unknown): string | null {
    const formatError = validateEmailFormat(value);
    if (formatError) return formatError;
    if (typeof value === "string" && !isAllowedEmail(value, allowExternalEmail)) {
      return SCHOOL_EMAIL_REQUIRED_MESSAGE;
    }
    return null;
  }

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (isPending) return;
    await submitForm({ email: requiredString(email), role, clubId, allowExternalEmail });
  }

  return (
    <Modal className={styles.modal} title="Add user" isOpen={isOpen} onOpenChange={onOpenChange}>
      <Form validationBehavior="native" onSubmit={handleSubmit}>
        <div className={styles.form}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            validate={validateEmail}
            isDisabled={isPending}
          />
          <Checkbox
            isSelected={allowExternalEmail}
            onChange={setAllowExternalEmail}
            isDisabled={isPending}
            description={
              role === Role.ADMIN
                ? `Permit an address outside ${SCHOOL_EMAIL_DOMAINS_TEXT}. External admins get full access, so only use this for verified collaborators.`
                : `Permit an address outside ${SCHOOL_EMAIL_DOMAINS_TEXT}. Only use this for verified external collaborators.`
            }
          >
            Allow external email
          </Checkbox>
          <Select
            label="Role"
            value={role}
            onChange={(value) => {
              const selectedRole = String(value) as AssignableRole;
              if (ASSIGNABLE_ROLES.includes(selectedRole)) setRole(selectedRole);
            }}
            validate={createFieldValidator(AddPendingUserSchema.shape.role)}
            isDisabled={isPending}
          >
            {ASSIGNABLE_ROLES.map((item) => (
              <SelectItem key={item} id={item}>
                {item}
              </SelectItem>
            ))}
          </Select>
          <Select
            label="Club"
            value={clubId ?? NO_CLUB}
            onChange={(value) =>
              setClubId(value == null || value === NO_CLUB ? null : String(value))
            }
            isDisabled={isPending}
          >
            <SelectItem id={NO_CLUB}>No club</SelectItem>
            {clubs.map((club) => (
              <SelectItem key={club.id} id={club.id}>
                {formatClubLabel(club)}
              </SelectItem>
            ))}
          </Select>
          <div className={styles.actions}>
            <Button
              className={styles.button}
              type="button"
              variant="secondary"
              onPress={handleCancel}
              isDisabled={isPending}
            >
              Cancel
            </Button>
            <Button
              className={styles.button}
              type="submit"
              variant="primary"
              isDisabled={isPending}
              isPending={isPending}
            >
              Add user
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
