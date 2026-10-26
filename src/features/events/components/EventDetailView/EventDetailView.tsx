"use client";

import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaArrowLeft,
  FaCalendarDay,
  FaCalendarPlus,
  FaCalendarXmark,
  FaClock,
  FaLocationDot,
  FaUserGroup,
} from "react-icons/fa6";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog/ConfirmDialog";
import { Link } from "@/components/ui/Link/Link";
import { toastError, toastSuccess } from "@/lib/hooks/toast-utils";

import { cancelRegistration, registerForEvent, useEvent } from "../../event-data";
import { formatEventDay, formatEventTimeRange, formatLongDateTime } from "../../format";
import type { EventDetailData, EventMutationFailureReason } from "../../types";
import { EventStatusPill } from "../EventStatusPill/EventStatusPill";
import { RegistrationModal } from "../RegistrationModal/RegistrationModal";
import { SeatAvailabilityCard } from "../SeatAvailabilityCard/SeatAvailabilityCard";
import styles from "./EventDetailView.module.css";

interface EventDetailViewProps {
  eventId: string;
  displayEvent?: EventDetailData;
}

interface InfoItemProps {
  icon: IconType;
  label: string;
  value: string;
}

const failureMessages: Record<EventMutationFailureReason, string> = {
  full: "This event is full. No seats are currently available.",
  closed: "Registration is closed for this event.",
  started: "The event has already started, so registration changes are no longer available.",
  not_registered: "You are not registered for this event.",
  not_found: "This event is no longer available.",
};

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoIcon} aria-hidden="true">
        <Icon />
      </span>
      <div className={styles.infoText}>
        <dt className={styles.infoLabel}>{label}</dt>
        <dd className={styles.infoValue}>{value}</dd>
      </div>
    </div>
  );
}

export function EventDetailView({ eventId, displayEvent }: EventDetailViewProps) {
  const mockEvent = useEvent(eventId);
  const event = displayEvent ?? mockEvent;
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  if (!event) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <h1 className={styles.notFoundTitle}>Event not found</h1>
          <p className={styles.notFoundText}>
            The event may have been removed or the link is incorrect.
          </p>
          <Link href="/events">Back to events</Link>
        </div>
      </div>
    );
  }

  function handleRegister() {
    const result = registerForEvent(eventId);
    setIsRegisterOpen(false);

    if (!result.success) {
      toastError("Could not register", failureMessages[result.reason]);
      return;
    }

    setIsSuccessOpen(true);
  }

  function handleCancel() {
    const result = cancelRegistration(eventId);
    if (!result.success) {
      toastError("Could not cancel registration", failureMessages[result.reason]);
      return;
    }

    setIsCancelOpen(false);
    setIsDetailsOpen(false);
    toastSuccess(
      "Registration cancelled",
      "Your seat has been released. You can register again before the event starts.",
    );
  }

  const registration =
    mockEvent?.registration?.state === "registered" ? mockEvent.registration : null;

  return (
    <div className={styles.page}>
      <Link href="/events" variant="unstyled" className={styles.backLink}>
        <FaArrowLeft aria-hidden="true" />
        Back to events
      </Link>

      <div className={styles.layout}>
        <article className={styles.mainCard}>
          <header className={styles.eventHeader}>
            <h1 className={styles.eventTitle}>{event.title}</h1>
            {mockEvent && (
              <div className={styles.tags}>
                <EventStatusPill status={mockEvent.status} />
              </div>
            )}
          </header>

          <section className={styles.about} aria-labelledby="about-event-heading">
            <h2 id="about-event-heading" className={styles.sectionTitle}>
              About this event
            </h2>
            <p className={styles.aboutText}>{event.description}</p>
          </section>

          <dl className={styles.infoGrid}>
            <InfoItem icon={FaCalendarDay} label="Date" value={formatEventDay(event.startAt)} />
            <InfoItem
              icon={FaClock}
              label="Time"
              value={formatEventTimeRange(event.startAt, event.endAt)}
            />
            <InfoItem icon={FaLocationDot} label="Venue" value={event.venue} />
            <InfoItem icon={FaUserGroup} label="Organizer" value={event.organizer} />
            {mockEvent && (
              <>
                <InfoItem
                  icon={FaCalendarPlus}
                  label="Registration opens"
                  value={formatLongDateTime(mockEvent.registrationOpensAt)}
                />
                <InfoItem
                  icon={FaCalendarXmark}
                  label="Registration closes"
                  value={formatLongDateTime(mockEvent.registrationClosesAt)}
                />
              </>
            )}
          </dl>
        </article>

        {mockEvent && (
          <aside className={styles.sidebar} aria-label="Registration">
            <SeatAvailabilityCard
              event={mockEvent}
              onRegister={() => setIsRegisterOpen(true)}
              onManageRegistration={() => setIsDetailsOpen(true)}
            />
          </aside>
        )}
      </div>

      {mockEvent && (
        <>
          <ConfirmDialog
            isOpen={isRegisterOpen}
            onOpenChange={setIsRegisterOpen}
            title="Register for this event?"
            confirmLabel="Yes, register"
            cancelLabel="Keep browsing"
            onConfirm={handleRegister}
          >
            Your seat will be reserved and you&apos;ll get a registration reference.
          </ConfirmDialog>

          {registration && (
            <>
              <RegistrationModal
                mode="success"
                isOpen={isSuccessOpen}
                onOpenChange={setIsSuccessOpen}
                reference={registration.reference}
              />

              <RegistrationModal
                mode="manage"
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                reference={registration.reference}
                canCancel={mockEvent?.canCancel ?? false}
                onCancel={() => setIsCancelOpen(true)}
              />
            </>
          )}

          <ConfirmDialog
            isOpen={isCancelOpen}
            onOpenChange={setIsCancelOpen}
            title="Cancel your registration?"
            confirmLabel="Cancel registration"
            cancelLabel="Keep registration"
            onConfirm={handleCancel}
          >
            Your seat will be released. You can register again before the event starts.
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}
