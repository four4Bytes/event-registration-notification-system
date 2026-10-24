"use client";

import { useEffect, useState } from "react";
import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button/Button";
import { Modal } from "@/components/ui/Modal/Modal";
import { Select, SelectItem } from "@/components/ui/Select/Select";
import { getClubOptionsAction } from "@/features/clubs/actions";
import { formatClubLabel } from "@/features/clubs/constants";
import type { ClubOption } from "@/features/clubs/queries";
import { setUserClubAction } from "@/features/users/actions";
import { SetUserClubSchema, type SetUserClubPayload } from "@/features/users/schemas";
import { toastError } from "@/lib/hooks/toast-utils";
import { useModalForm } from "@/lib/hooks/useModalForm";

import styles from "./AssignClubModal.module.css";

const NO_CLUB = "none";

interface AssignClubModalProps {
  userId: string;
  userLabel: string;
  initialClubId: string | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export function AssignClubModal({
  userId,
  userLabel,
  initialClubId,
  isOpen,
  onOpenChange,
  onSuccess,
}: AssignClubModalProps) {
  const [clubId, setClubId] = useState<string | null>(initialClubId);
  const [clubs, setClubs] = useState<ClubOption[]>([]);

  const { isPending, submitForm, handleCancel } = useModalForm<SetUserClubPayload>({
    submit: setUserClubAction,
    onOpenChange,
    onSuccess,
    successMessage: "Club updated",
    successDescription: "The user's club assignment has been updated.",
    failureMessage: "Failed to update club",
    schema: SetUserClubSchema,
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
    await submitForm({ userId, clubId });
  }

  return (
    <Modal
      className={styles.modal}
      title={`Assign club for ${userLabel}`}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form validationBehavior="native" onSubmit={handleSubmit}>
        <div className={styles.form}>
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
              Save club
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
