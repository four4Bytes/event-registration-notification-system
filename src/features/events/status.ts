import { MOCK_NOW, type EventStatus, type StudentEvent } from "./types";

export function getRemainingSeats(event: StudentEvent): number | null {
  return event.capacity === null ? null : Math.max(0, event.capacity - event.seatsTaken);
}

export function isEventStarted(event: StudentEvent, now: string | Date = MOCK_NOW): boolean {
  return new Date(now).getTime() >= new Date(event.startAt).getTime();
}

export function isRegistrationClosed(event: StudentEvent, now: string | Date = MOCK_NOW): boolean {
  return (
    isEventStarted(event, now) ||
    new Date(now).getTime() >= new Date(event.registrationClosesAt).getTime()
  );
}

export function resolveEventStatus(
  event: StudentEvent,
  now: string | Date = MOCK_NOW,
): EventStatus {
  if (event.registration?.state === "registered") return "registered";
  if (isRegistrationClosed(event, now)) return "closed";
  const remainingSeats = getRemainingSeats(event);
  if (remainingSeats !== null && remainingSeats <= 0) return "full";
  return "open";
}
