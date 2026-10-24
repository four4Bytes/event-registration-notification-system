"use client";

import { useState } from "react";
import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { TextField } from "@/components/ui/TextField/TextField";
import { createClubAction, updateClubAction } from "@/features/clubs/actions";
import type { ClubOption } from "@/features/clubs/queries";
import { CreateClubSchema, type CreateClubPayload } from "@/features/clubs/schemas";
import { useModalForm } from "@/lib/hooks/useModalForm";
import { createFieldValidator, optionalString, requiredString } from "@/lib/validation/form-utils";

import styles from "./ClubFormModal.module.css";

interface ClubFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
  club?: ClubOption;
}

export function ClubFormModal({ isOpen, onOpenChange, onSuccess, club }: ClubFormModalProps) {
  const [name, setName] = useState(club?.name ?? "");
  const [shortName, setShortName] = useState(club?.shortName ?? "");

  const reset = () => {
    setName(club?.name ?? "");
    setShortName(club?.shortName ?? "");
  };

  const submit = (payload: CreateClubPayload) =>
    club ? updateClubAction({ clubId: club.id, ...payload }) : createClubAction(payload);

  const { isPending, submitForm, handleCancel } = useModalForm<CreateClubPayload>({
    submit,
    onOpenChange,
    onSuccess,
    reset,
    successMessage: club ? "Club updated" : "Club added",
    successDescription: club
      ? "The club details have been updated."
      : "The club is now available across the system.",
    failureMessage: club ? "Failed to update club" : "Failed to add club",
    schema: CreateClubSchema,
  });

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (isPending) return;
    const payload: CreateClubPayload = {
      name: requiredString(name),
      shortName: optionalString(shortName),
    };
    await submitForm(payload);
  }

  return (
    <Modal
      className={styles.modal}
      title={club ? `Edit ${club.shortName ?? club.name}` : "Add club"}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form validationBehavior="native" onSubmit={handleSubmit}>
        <div className={styles.form}>
          <TextField
            label="Club name"
            value={name}
            onChange={setName}
            description="Full official name, e.g. League of Information Technology Students"
            validate={createFieldValidator(CreateClubSchema.shape.name)}
            isDisabled={isPending}
          />
          <TextField
            label="Short name"
            value={shortName}
            onChange={(value) => setShortName(value.toUpperCase())}
            description="Optional abbreviation or acronym, e.g. LITS"
            validate={createFieldValidator(CreateClubSchema.shape.shortName)}
            isDisabled={isPending}
          />
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
              {club ? "Save club" : "Add club"}
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
