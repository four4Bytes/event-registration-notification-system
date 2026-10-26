"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaArrowLeft, FaFacebook, FaPenToSquare, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/Button/Button";
import { ButtonLink } from "@/components/ui/ButtonLink/ButtonLink";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import { StatusBadge, type StatusBadgeVariant } from "@/components/ui/StatusBadge/StatusBadge";
import { ClubLabel } from "@/features/clubs/components/ClubLabel/ClubLabel";
import { deleteEventAction } from "@/features/events/actions";
import { EventFormModal } from "@/features/events/components/EventFormModal/EventFormModal";
import { EventQrPanel } from "@/features/events/components/EventQrPanel/EventQrPanel";
import type { EventDetail } from "@/features/events/queries";
import { EventStatus } from "@/generated/prisma/browser";
import { toastActionError, toastSuccess } from "@/lib/hooks/toast-utils";
import { formatDateTime } from "@/lib/primitives/date";

import styles from "./EventDetailView.module.css";

interface EventDetailViewProps {
  event: EventDetail;
  qr: { link: string; dataUrl: string } | null;
  canManage: boolean;
  canDelete: boolean;
  isAdmin: boolean;
}

const statusLabels: Record<EventStatus, string> = {
  [EventStatus.PENDING]: "Pending",
  [EventStatus.APPROVED]: "Approved",
  [EventStatus.REJECTED]: "Rejected",
  [EventStatus.CANCELLED]: "Cancelled",
};

const statusVariants: Record<EventStatus, StatusBadgeVariant> = {
  [EventStatus.PENDING]: "pending",
  [EventStatus.APPROVED]: "done",
  [EventStatus.REJECTED]: "danger",
  [EventStatus.CANCELLED]: "cancelled",
};

export function EventDetailView({
  event,
  qr,
  canManage,
  canDelete,
  isAdmin,
}: EventDetailViewProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className={styles.page}>
      <ButtonLink href="/events" variant="ghost" className={styles.back}>
        <FaArrowLeft aria-hidden="true" /> Back to events
      </ButtonLink>

      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{event.title}</h1>
          <div className={styles.badges}>
            <StatusBadge variant={statusVariants[event.status]}>
              {statusLabels[event.status]}
            </StatusBadge>
            {event.clubName && <ClubLabel name={event.clubName} shortName={event.clubShortName} />}
          </div>
        </div>
        <div className={styles.actions}>
          {canManage && (
            <Button variant="secondary" onPress={() => setEditOpen(true)}>
              <FaPenToSquare aria-hidden="true" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="secondary" onPress={() => setDeleteOpen(true)}>
              <FaTrash aria-hidden="true" /> Delete
            </Button>
          )}
          {event.facebookUrl && (
            <ButtonLink href={event.facebookUrl} target="_blank" rel="noreferrer">
              <FaFacebook aria-hidden="true" /> Open Facebook Event
            </ButtonLink>
          )}
        </div>
      </header>

      <div className={styles.body}>
        <section className={styles.details}>
          <dl className={styles.meta}>
            <div>
              <dt>Starts</dt>
              <dd>{formatDateTime(event.startAt)}</dd>
            </div>
            {event.endAt && (
              <div>
                <dt>Ends</dt>
                <dd>{formatDateTime(event.endAt)}</dd>
              </div>
            )}
            <div>
              <dt>Location</dt>
              <dd>{event.venue}</dd>
            </div>
            <div>
              <dt>Organised by</dt>
              <dd>{event.createdByName}</dd>
            </div>
          </dl>
          {event.description && <p className={styles.description}>{event.description}</p>}
        </section>

        {qr && <EventQrPanel eventTitle={event.title} link={qr.link} qrDataUrl={qr.dataUrl} />}
      </div>

      {canManage && (
        <EventFormModal
          isOpen={editOpen}
          onOpenChange={setEditOpen}
          event={event}
          isAdmin={isAdmin}
          onSuccess={() => router.refresh()}
        />
      )}

      <ConfirmDialog
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete event"
        confirmLabel="Delete event"
        onConfirm={async () => {
          const result = await deleteEventAction({ eventId: event.id });
          if (!result.success) {
            toastActionError(result, "delete event");
            return;
          }
          setDeleteOpen(false);
          toastSuccess("Event deleted", `${event.title} has been deleted.`);
          router.push("/events");
        }}
      >
        Are you sure you want to delete <strong>{event.title}</strong>? Its attendance records will
        be removed, notifications will keep their content without the event link, and its QR code
        will stop working. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
