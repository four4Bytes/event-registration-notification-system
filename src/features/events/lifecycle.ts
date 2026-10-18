import { EventStatus, type Event } from "@/generated/prisma/browser";

const ALLOWED_TRANSITIONS: Record<EventStatus, readonly EventStatus[]> = {
  // shortcut: the PUBLISHED edges out of DRAFT, PENDING_APPROVAL and REVISION_REQUESTED are
  // ticket 4's temporary publish path; ticket 5 removes them once the approval chain lands.
  DRAFT: [EventStatus.PENDING_APPROVAL, EventStatus.PUBLISHED, EventStatus.CANCELLED],
  PENDING_APPROVAL: [
    EventStatus.APPROVED,
    EventStatus.REVISION_REQUESTED,
    EventStatus.REJECTED,
    EventStatus.PUBLISHED,
    EventStatus.CANCELLED,
  ],
  REVISION_REQUESTED: [
    EventStatus.PENDING_APPROVAL,
    EventStatus.PUBLISHED,
    EventStatus.CANCELLED,
  ],
  APPROVED: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
  PUBLISHED: [EventStatus.CANCELLED],
  REJECTED: [],
  CANCELLED: [],
};

export function canTransition(from: EventStatus, to: EventStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function canRegister(event: Pick<Event, "status">): boolean {
  return event.status === EventStatus.PUBLISHED;
}
