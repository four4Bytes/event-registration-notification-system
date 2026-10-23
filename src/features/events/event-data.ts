"use client";

import { useSyncExternalStore } from "react";

import { initialEvents } from "./initial-events";
import { getRemainingSeats, isEventStarted, resolveEventStatus } from "./status";
import {
  MOCK_NOW,
  type EventFilter,
  type EventMutationResult,
  type EventView,
  type StudentEvent,
} from "./types";

let events = initialEvents;
let viewCache: EventView[] | null = null;
const listeners = new Set<() => void>();

function toView(event: StudentEvent): EventView {
  return {
    ...event,
    status: resolveEventStatus(event, MOCK_NOW),
    remainingSeats: getRemainingSeats(event),
    canCancel: event.registration?.state === "registered" && !isEventStarted(event, MOCK_NOW),
  };
}

function notify(): void {
  viewCache = null;
  for (const listener of listeners) listener();
}

function findEvent(eventId: string): StudentEvent | null {
  return events.find((event) => event.id === eventId) ?? null;
}

export function getEvents(): EventView[] {
  viewCache ??= events.map(toView);
  return viewCache;
}

export function getEvent(eventId: string): EventView | null {
  return getEvents().find((event) => event.id === eventId) ?? null;
}

export function registerForEvent(
  eventId: string,
  now: string | Date = MOCK_NOW,
): EventMutationResult {
  const event = findEvent(eventId);
  if (!event) return { success: false, reason: "not_found" };

  const status = resolveEventStatus(event, now);
  if (status === "registered") return { success: true, event: toView(event) };
  if (status === "full") return { success: false, reason: "full" };
  if (status === "closed") return { success: false, reason: "closed" };

  const reference = event.registration?.reference ?? event.mockReference;
  events = events.map((candidate) =>
    candidate.id === eventId
      ? {
          ...candidate,
          seatsTaken: candidate.seatsTaken + 1,
          registration: { reference, state: "registered" },
        }
      : candidate,
  );
  notify();
  return { success: true, event: getEvent(eventId)! };
}

export function cancelRegistration(
  eventId: string,
  now: string | Date = MOCK_NOW,
): EventMutationResult {
  const event = findEvent(eventId);
  if (!event) return { success: false, reason: "not_found" };

  const registration = event.registration;
  if (registration?.state !== "registered") return { success: false, reason: "not_registered" };
  if (isEventStarted(event, now)) return { success: false, reason: "started" };

  events = events.map((candidate) =>
    candidate.id === eventId
      ? {
          ...candidate,
          seatsTaken: Math.max(0, candidate.seatsTaken - 1),
          registration: { reference: registration.reference, state: "cancelled" },
        }
      : candidate,
  );
  notify();
  return { success: true, event: getEvent(eventId)! };
}

export function filterEvents(
  eventsToFilter: EventView[],
  filter: EventFilter,
  now: string | Date = MOCK_NOW,
): EventView[] {
  const search = filter.search.trim().toLowerCase();
  const nowTime = new Date(now).getTime();

  return eventsToFilter
    .filter((event) => {
      const matchesSearch =
        search.length === 0 ||
        event.title.toLowerCase().includes(search) ||
        event.organizer.toLowerCase().includes(search);
      const matchesHost = filter.host === "all" || event.host === filter.host;
      const matchesTime = filter.time === "all" || new Date(event.startAt).getTime() >= nowTime;
      return matchesSearch && matchesHost && matchesTime;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useEvents(): EventView[] {
  return useSyncExternalStore(subscribe, getEvents, getEvents);
}

export function useEvent(eventId: string): EventView | null {
  const allEvents = useEvents();
  return allEvents.find((event) => event.id === eventId) ?? null;
}
