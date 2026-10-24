"use client";

import { Modal } from "@/components/ui/Modal/Modal";
import { ClubLabel } from "@/features/clubs/components/ClubLabel/ClubLabel";
import { NotificationAudience } from "@/generated/prisma/browser";
import { formatDateTime } from "@/lib/primitives/date";

import type { NotificationRow } from "../../queries";
import styles from "./NotificationDetailModal.module.css";

interface NotificationDetailModalProps {
  notification: NotificationRow;
  onOpenChange: (isOpen: boolean) => void;
}

export function NotificationDetailModal({
  notification,
  onOpenChange,
}: NotificationDetailModalProps) {
  const audienceLabel = notification.audience === NotificationAudience.CLUB ? "Club" : "All users";

  return (
    <Modal className={styles.modal} title={notification.title} isOpen onOpenChange={onOpenChange}>
      <div className={styles.meta}>
        <span className={styles.badge}>{audienceLabel}</span>
        {notification.clubName && (
          <ClubLabel
            name={notification.clubName}
            shortName={notification.clubShortName}
            className={styles.badge}
          />
        )}
        <time className={styles.time} dateTime={notification.createdAt.toISOString()}>
          {formatDateTime(notification.createdAt)}
        </time>
      </div>
      <p className={styles.body}>{notification.body}</p>
    </Modal>
  );
}
