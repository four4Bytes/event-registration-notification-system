"use client";

import { Time, type CalendarDate } from "@internationalized/date";
import { useEffect, useState } from "react";
import { Form } from "react-aria-components";

import { Button } from "@/components/ui/Button/Button";
import { DatePicker } from "@/components/ui/DatePicker/DatePicker";
import { Modal } from "@/components/ui/Modal/Modal";
import { Select, SelectItem } from "@/components/ui/Select/Select";
import { TextField } from "@/components/ui/TextField/TextField";
import { TimeField } from "@/components/ui/TimeField/TimeField";
import { getClubOptionsAction } from "@/features/clubs/actions";
import { formatClubLabel } from "@/features/clubs/constants";
import type { ClubOption } from "@/features/clubs/queries";
import { createEventAction, updateEventAction } from "@/features/events/actions";
import type { EventDetail } from "@/features/events/queries";
import { CreateEventSchema, type CreateEventPayload } from "@/features/events/schemas";
import { toastError } from "@/lib/hooks/toast-utils";
import { useModalForm } from "@/lib/hooks/useModalForm";
import { combineDateTime, getToday, toCalendarDate, toTimeValue } from "@/lib/primitives/date";
import { createFieldValidator, optionalString, requiredString } from "@/lib/validation/form-utils";

import styles from "./EventFormModal.module.css";

const NO_CLUB = "none";

interface EventFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: () => void;
  event?: EventDetail;
  isAdmin: boolean;
}

export function EventFormModal({
  isOpen,
  onOpenChange,
  onSuccess,
  event,
  isAdmin,
}: EventFormModalProps) {
  const initialDate = event ? toCalendarDate(event.startAt) : getToday();
  const initialTime = event ? toTimeValue(event.startAt) : new Time(9, 0);

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [date, setDate] = useState<CalendarDate | null>(initialDate);
  const [time, setTime] = useState<Time | null>(initialTime);
  const [facebookUrl, setFacebookUrl] = useState(event?.facebookUrl ?? "");
  const [clubId, setClubId] = useState<string | null>(event?.clubId ?? null);
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);

  const reset = () => {
    setTitle(event?.title ?? "");
    setDescription(event?.description ?? "");
    setVenue(event?.venue ?? "");
    setDate(event ? toCalendarDate(event.startAt) : getToday());
    setTime(event ? toTimeValue(event.startAt) : new Time(9, 0));
    setFacebookUrl(event?.facebookUrl ?? "");
    setClubId(event?.clubId ?? null);
  };

  const submit = (payload: CreateEventPayload) =>
    event ? updateEventAction({ eventId: event.id, ...payload }) : createEventAction(payload);

  const { isPending, submitForm, handleCancel } = useModalForm<CreateEventPayload>({
    submit,
    onOpenChange,
    onSuccess,
    reset,
    successMessage: event ? "Event updated" : "Event created",
    successDescription: event
      ? "The event details have been updated."
      : "A QR code is ready to share for this event.",
    failureMessage: event ? "Failed to update event" : "Failed to create event",
    schema: CreateEventSchema,
  });

  useEffect(() => {
    if (!isOpen || !isAdmin) return;
    let cancelled = false;
    async function loadClubs() {
      setIsLoadingClubs(true);
      try {
        const rows = await getClubOptionsAction();
        if (!cancelled) setClubs(rows);
      } catch {
        if (!cancelled) {
          toastError(
            "Failed to load clubs",
            "We couldn't retrieve the club list. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setIsLoadingClubs(false);
      }
    }
    void loadClubs();
    return () => {
      cancelled = true;
    };
  }, [isOpen, isAdmin]);

  async function handleSubmit(submitEvent: React.SyntheticEvent) {
    submitEvent.preventDefault();
    if (isPending) return;
    if (!date || !time) {
      toastError("Missing schedule", "Choose the event's start date and time.");
      return;
    }
    const payload: CreateEventPayload = {
      title: requiredString(title),
      description: optionalString(description),
      venue: requiredString(venue),
      startAt: combineDateTime(date, time),
      facebookUrl: optionalString(facebookUrl),
      clubId: isAdmin ? clubId : null,
    };
    await submitForm(payload);
  }

  return (
    <Modal
      className={styles.modal}
      title={event ? `Edit ${event.title}` : "Add event"}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form validationBehavior="native" onSubmit={handleSubmit}>
        <div className={styles.form}>
          <TextField
            label="Title"
            value={title}
            onChange={setTitle}
            validate={createFieldValidator(CreateEventSchema.shape.title)}
            isDisabled={isPending}
          />
          <TextField
            label="Description"
            value={description}
            onChange={setDescription}
            description="Optional details attendees should know."
            validate={createFieldValidator(CreateEventSchema.shape.description)}
            isTextArea
            rows={3}
            isDisabled={isPending}
          />
          <TextField
            label="Location"
            value={venue}
            onChange={setVenue}
            validate={createFieldValidator(CreateEventSchema.shape.venue)}
            isDisabled={isPending}
          />
          <div className={styles.schedule}>
            <DatePicker label="Date" value={date} onChange={setDate} isDisabled={isPending} />
            <TimeField label="Start time" value={time} onChange={setTime} isDisabled={isPending} />
          </div>
          <TextField
            label="Facebook event link"
            type="url"
            value={facebookUrl}
            onChange={setFacebookUrl}
            description="Optional. Must be a public facebook.com, fb.com, or fb.me link."
            validate={createFieldValidator(CreateEventSchema.shape.facebookUrl)}
            isDisabled={isPending}
          />
          {isAdmin && (
            <Select
              label="Club"
              value={clubId ?? NO_CLUB}
              onChange={(value) =>
                setClubId(value == null || value === NO_CLUB ? null : String(value))
              }
              isLoading={isLoadingClubs}
              isDisabled={isPending}
              description="Leave as organisation-wide to show the event to every club."
            >
              <SelectItem id={NO_CLUB}>Organisation-wide</SelectItem>
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
              isDisabled={isPending}
              isPending={isPending}
            >
              {event ? "Save event" : "Create event"}
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
}
