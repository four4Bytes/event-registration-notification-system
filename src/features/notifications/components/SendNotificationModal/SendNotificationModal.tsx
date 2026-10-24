"use client";

import { useEffect, useState } from "react";
import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { Select, SelectItem } from "@/components/ui/Select/Select";
import { TextField } from "@/components/ui/TextField/TextField";
import { getClubOptionsAction } from "@/features/clubs/actions";
import { formatClubLabel } from "@/features/clubs/constants";
import type { ClubOption } from "@/features/clubs/queries";
import { sendNotificationAction } from "@/features/notifications/actions";
import {
  SendNotificationSchema,
  type SendNotificationPayload,
} from "@/features/notifications/schemas";
import { NotificationAudience } from "@/generated/prisma/browser";
import { toastError } from "@/lib/hooks/toast-utils";
import { useModalForm } from "@/lib/hooks/useModalForm";
import { createFieldValidator, requiredString } from "@/lib/validation/form-utils";

import styles from "./SendNotificationModal.module.css";

interface SendNotificationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export function SendNotificationModal({
  isOpen,
  onOpenChange,
  onSuccess,
}: SendNotificationModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<NotificationAudience>(NotificationAudience.ALL);
  const [clubId, setClubId] = useState<string | null>(null);
  const [clubs, setClubs] = useState<ClubOption[]>([]);

  const reset = () => {
    setTitle("");
    setBody("");
    setAudience(NotificationAudience.ALL);
    setClubId(null);
  };

  const { isPending, submitForm, handleCancel } = useModalForm<SendNotificationPayload>({
    submit: sendNotificationAction,
    onOpenChange,
    onSuccess,
    reset,
    successMessage: "Notification sent",
    successDescription: "Recipients will see the announcement in their feed and email.",
    failureMessage: "Failed to send notification",
    schema: SendNotificationSchema,
  });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    async function loadClubs() {
      try {
        const rows = await getClubOptionsAction();
        if (!cancelled) setClubs(rows);
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

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    if (isPending) return;
    await submitForm({
      title: requiredString(title),
      body: requiredString(body),
      audience,
      clubId,
    });
  }

  return (
    <Modal
      className={styles.modal}
      title="Send Notification"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form validationBehavior="native" onSubmit={handleSubmit}>
        <div className={styles.form}>
          <TextField
            label="Title"
            value={title}
            onChange={setTitle}
            validate={createFieldValidator(SendNotificationSchema.shape.title)}
            isDisabled={isPending}
          />
          <TextField
            label="Body"
            value={body}
            onChange={setBody}
            isTextArea
            rows={5}
            validate={createFieldValidator(SendNotificationSchema.shape.body)}
            isDisabled={isPending}
          />
          <Select
            label="Audience"
            value={audience}
            onChange={(value) => {
              if (value === NotificationAudience.ALL || value === NotificationAudience.CLUB) {
                setAudience(value);
                if (value === NotificationAudience.ALL) setClubId(null);
              }
            }}
            isDisabled={isPending}
          >
            <SelectItem id={NotificationAudience.ALL}>All users</SelectItem>
            <SelectItem id={NotificationAudience.CLUB}>Club</SelectItem>
          </Select>
          {audience === NotificationAudience.CLUB && (
            <Select
              label="Club"
              value={clubId}
              onChange={(value) => setClubId(value == null ? null : String(value))}
              validate={createFieldValidator(SendNotificationSchema.shape.clubId)}
              isDisabled={isPending}
              isRequired
            >
              {clubs.map((club) => (
                <SelectItem key={club.id} id={club.id}>
                  {formatClubLabel(club)}
                </SelectItem>
              ))}
            </Select>
          )}
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
              isDisabled={isPending || (audience === NotificationAudience.CLUB && !clubId)}
              isPending={isPending}
            >
              Send
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
