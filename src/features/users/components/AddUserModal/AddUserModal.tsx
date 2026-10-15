"use client";

import { useState } from "react";
import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { Select, SelectItem } from "@/components/ui/Select/Select";
import { TextField } from "@/components/ui/TextField/TextField";
import { addPendingUserAction } from "@/features/users/actions";
import { AddPendingUserSchema } from "@/features/users/schemas";
import { Role } from "@/generated/prisma/browser";
import { useModalForm } from "@/lib/hooks/useModalForm";
import { createFieldValidator, requiredString } from "@/lib/validation/form-utils";

import styles from "./AddUserModal.module.css";

const roles = [Role.STUDENT, Role.OFFICER, Role.ADMIN, Role.ATTENDANCE_STAFF, Role.APPROVER];
type AssignableRole = (typeof roles)[number];

interface AddUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export function AddUserModal({ isOpen, onOpenChange, onSuccess }: AddUserModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>(Role.STUDENT);

  const reset = () => {
    setEmail("");
    setRole(Role.STUDENT);
  };

  const { isPending, submitForm, handleCancel } = useModalForm({
    submit: addPendingUserAction,
    onOpenChange,
    onSuccess,
    reset,
    successMessage: "User added",
    successDescription: "The invitation has been sent to the school email address.",
    failureMessage: "Failed to add user",
    schema: AddPendingUserSchema,
  });

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (isPending) return;
    await submitForm({ email: requiredString(email), role });
  }

  return (
    <Modal className={styles.modal} title="Add user" isOpen={isOpen} onOpenChange={onOpenChange}>
      <Form validationBehavior="native" onSubmit={handleSubmit}>
        <div className={styles.form}>
          <TextField
            label="School email"
            type="email"
            value={email}
            onChange={setEmail}
            validate={createFieldValidator(AddPendingUserSchema.shape.email)}
            isDisabled={isPending}
          />
          <Select
            label="Role"
            value={role}
            onChange={(value) => {
              const selectedRole = String(value) as AssignableRole;
              if (roles.includes(selectedRole)) setRole(selectedRole);
            }}
            validate={createFieldValidator(AddPendingUserSchema.shape.role)}
            isDisabled={isPending}
          >
            {roles.map((item) => (
              <SelectItem key={item} id={item}>
                {item}
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
