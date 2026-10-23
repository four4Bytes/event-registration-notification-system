import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventFilter } from "./types";

let data: typeof import("./event-data");

const filter = (overrides: Partial<EventFilter> = {}): EventFilter => ({
  search: "",
  host: "all",
  time: "all",
  ...overrides,
});

beforeEach(async () => {
  vi.resetModules();
  data = await import("./event-data");
});

describe("getEvents", () => {
  it("returns eleven events and a stable snapshot", () => {
    const first = data.getEvents();
    expect(first).toHaveLength(11);
    expect(data.getEvents()).toBe(first);
  });
});

describe("registerForEvent", () => {
  it("registers, releases, and reuses the same reference", () => {
    const registered = data.registerForEvent("foundation-day-convocation");
    expect(registered.success).toBe(true);
    if (!registered.success) return;
    expect(registered.event.seatsTaken).toBe(256);
    expect(registered.event.status).toBe("registered");
    expect(registered.event.registration).toEqual({
      reference: "CH-2026-00691",
      state: "registered",
    });

    const cancelled = data.cancelRegistration("foundation-day-convocation");
    expect(cancelled.success).toBe(true);
    if (!cancelled.success) return;
    expect(cancelled.event.seatsTaken).toBe(255);
    expect(cancelled.event.registration).toEqual({
      reference: "CH-2026-00691",
      state: "cancelled",
    });

    const again = data.registerForEvent("foundation-day-convocation");
    expect(again.success).toBe(true);
    if (!again.success) return;
    expect(again.event.seatsTaken).toBe(256);
    expect(again.event.registration?.reference).toBe("CH-2026-00691");
  });

  it("invalidates the snapshot after a write", () => {
    const before = data.getEvents();
    data.registerForEvent("foundation-day-convocation");
    expect(data.getEvents()).not.toBe(before);
  });

  it("blocks full and closed events", () => {
    expect(data.registerForEvent("robotics-workshop-arduino-basics")).toEqual({
      success: false,
      reason: "full",
    });
    expect(data.registerForEvent("library-circle-open-mic")).toEqual({
      success: false,
      reason: "closed",
    });
  });
});

describe("cancelRegistration", () => {
  it("blocks cancelling a non-registered event", () => {
    expect(data.cancelRegistration("foundation-day-convocation")).toEqual({
      success: false,
      reason: "not_registered",
    });
  });

  it("blocks cancelling after the event starts", () => {
    expect(
      data.cancelRegistration("inter-school-debate-finals", "2026-11-15T00:00:00+08:00"),
    ).toEqual({ success: false, reason: "started" });
  });
});

describe("filterEvents", () => {
  it("filters by search, host, and upcoming", () => {
    const events = data.getEvents();
    expect(data.filterEvents(events, filter({ search: "science" }))).toHaveLength(1);
    expect(data.filterEvents(events, filter({ host: "organization" }))).toHaveLength(2);
    expect(data.filterEvents(events, filter({ time: "upcoming" }))).toHaveLength(11);
  });
});
