"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button/Button";
import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/StatusBadge/StatusBadge";
import { getEventsAction, publishEventAction } from "@/features/events/actions";
import type { EventListRow } from "@/features/events/queries";
import { EventStatus } from "@/generated/prisma/browser";
import { toastActionError, toastError, toastSuccess } from "@/lib/hooks/toast-utils";
import { formatDateTime } from "@/lib/primitives/date";

import styles from "./EventsList.module.css";

interface EventsListProps {
  initialRows: EventListRow[];
  canPublish: boolean;
}

const statusLabels: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  REVISION_REQUESTED: "Revision requested",
  REJECTED: "Rejected",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  CANCELLED: "Cancelled",
};

const statusVariants: Record<EventStatus, StatusBadgeVariant> = {
  DRAFT: "pending",
  PENDING_APPROVAL: "info",
  REVISION_REQUESTED: "warning",
  REJECTED: "danger",
  APPROVED: "accent",
  PUBLISHED: "done",
  CANCELLED: "cancelled",
};

export function EventsList({ initialRows, canPublish }: EventsListProps) {
  const [rows, setRows] = useState(initialRows);

  async function refresh() {
    try {
      setRows(await getEventsAction());
    } catch {
      toastError(
        "Failed to refresh events",
        "We couldn't retrieve the event list. Please try again.",
      );
    }
  }

  async function publish(eventId: string) {
    const response = await publishEventAction({ eventId });
    if (!response.success) {
      toastActionError(response, "publish event");
      return;
    }
    toastSuccess("Event published", "Students can now see and register for this event.");
    await refresh();
  }

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Events</p>
          <h1>Events</h1>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Venue</th>
              <th>Starts</th>
              <th>Status</th>
              {canPublish && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{row.venue}</td>
                <td>{formatDateTime(row.startAt)}</td>
                <td>
                  <StatusBadge variant={statusVariants[row.status]}>
                    {statusLabels[row.status]}
                  </StatusBadge>
                </td>
                {canPublish && (
                  <td className={styles.actions}>
                    <Button
                      variant="ghost"
                      aria-label={`Publish ${row.title}`}
                      onPress={() => void publish(row.id)}
                    >
                      Publish
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
