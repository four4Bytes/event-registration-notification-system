"use client";

import clsx from "clsx";

import { ClubLabel } from "@/features/clubs/components/ClubLabel/ClubLabel";
import { formatDateTime } from "@/lib/primitives/date";

import type { NotificationRow } from "../../queries";
import styles from "./NotificationCard.module.css";

interface NotificationCardProps {
  notification: NotificationRow;
  onOpen: (notification: NotificationRow) => void;
}

export function NotificationCard({ notification, onOpen }: NotificationCardProps) {
  return (
    <div className={clsx(styles.card, !notification.isRead && styles.unread)}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.header}>
          <button type="button" className={styles.titleButton} onClick={() => onOpen(notification)}>
            <strong className={styles.title}>{notification.title}</strong>
          </button>
          <time className={styles.time} dateTime={notification.createdAt.toISOString()}>
            {formatDateTime(notification.createdAt)}
          </time>
        </span>
        <span className={styles.body}>{notification.body}</span>
        {notification.clubName && (
          <ClubLabel
            name={notification.clubName}
            shortName={notification.clubShortName}
            className={styles.club}
          />
        )}
      </span>
      {!notification.isRead && <span className={styles.srOnly}>Unread</span>}
    </div>
  );
}
