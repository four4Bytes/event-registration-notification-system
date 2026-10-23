/** Fixed clock for the mock event data, so screenshot states stay stable during review. */
export const MOCK_NOW = "2026-10-22T00:00:00+08:00";

export type EventStatus = "open" | "registered" | "full" | "closed";

export type RegistrationState = "registered" | "cancelled";

export interface EventRegistration {
  reference: string;
  state: RegistrationState;
}

export interface StudentEvent {
  id: string;
  title: string;
  organizer: string;
  description: string;
  venue: string;
  startAt: string;
  endAt: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  capacity: number;
  seatsTaken: number;
  host: "organization" | "club";
  registration: EventRegistration | null;
  mockReference: string;
}

export interface EventView extends StudentEvent {
  status: EventStatus;
  remainingSeats: number;
  canCancel: boolean;
}

export type EventDetailData = Pick<
  StudentEvent,
  "title" | "organizer" | "description" | "venue" | "startAt" | "endAt" | "host"
>;

export type EventMutationFailureReason =
  "not_found" | "full" | "closed" | "started" | "not_registered";

export type EventMutationResult =
  { success: true; event: EventView } | { success: false; reason: EventMutationFailureReason };

export interface EventFilter {
  search: string;
  host: "all" | "organization" | "club";
  time: "upcoming" | "all";
}
