import { describe, expect, it } from "vitest";

import {
  CreateEventSchema,
  EventPageQuerySchema,
  EventTokenSchema,
  isFacebookEventUrl,
} from "./schemas";

const startAt = new Date("2026-11-01T01:00:00.000Z");

const validEvent = {
  title: "General Assembly",
  venue: "AVR 1",
  startAt,
};

describe("isFacebookEventUrl", () => {
  it.each([
    "https://www.facebook.com/events/123456789/",
    "https://facebook.com/events/123456789",
    "https://m.facebook.com/events/123456789",
    "https://web.facebook.com/events/123456789",
    "https://fb.me/e/abc123",
  ])("accepts %s", (url) => {
    expect(isFacebookEventUrl(url)).toBe(true);
  });

  it.each([
    "https://example.com/events/123456789",
    "https://facebook.com",
    "https://facebook.com/",
    "javascript:alert(1)",
    "not a url",
  ])("rejects %s", (url) => {
    expect(isFacebookEventUrl(url)).toBe(false);
  });
});

describe("EventTokenSchema", () => {
  it("accepts a 32-character hex token", () => {
    expect(EventTokenSchema.safeParse("0123456789abcdef0123456789abcdef").success).toBe(true);
  });

  it.each([
    "0123456789ABCDEF0123456789ABCDEF",
    "0123456789abcdef0123456789abcde",
    "0123456789abcdef0123456789abcdef0",
    "../../etc/passwd",
  ])("rejects %s", (token) => {
    expect(EventTokenSchema.safeParse(token).success).toBe(false);
  });
});

describe("CreateEventSchema", () => {
  it("accepts the minimum required fields", () => {
    expect(CreateEventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("defaults the club to organisation-wide", () => {
    const parsed = CreateEventSchema.safeParse(validEvent);
    expect(parsed.success && parsed.data.clubId).toBe(null);
  });

  it("rejects a whitespace-only title", () => {
    expect(CreateEventSchema.safeParse({ ...validEvent, title: "   " }).success).toBe(false);
  });

  it("rejects a blank location", () => {
    expect(CreateEventSchema.safeParse({ ...validEvent, venue: "" }).success).toBe(false);
  });

  it("rejects a non-Facebook link", () => {
    expect(
      CreateEventSchema.safeParse({
        ...validEvent,
        facebookUrl: "https://example.com/events/1",
      }).success,
    ).toBe(false);
  });

  it("accepts an omitted Facebook link", () => {
    expect(CreateEventSchema.safeParse({ ...validEvent, facebookUrl: undefined }).success).toBe(
      true,
    );
  });

  it("rejects a missing start time", () => {
    expect(
      CreateEventSchema.safeParse({ title: "Talk", venue: "AVR 1", startAt: undefined }).success,
    ).toBe(false);
  });
});

describe("EventPageQuerySchema", () => {
  it("accepts status filters and an ascending sort", () => {
    const parsed = EventPageQuerySchema.safeParse({
      filters: { status: ["APPROVED", "PENDING"] },
      sort: { column: "startAt", direction: "asc" },
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown status filter", () => {
    expect(EventPageQuerySchema.safeParse({ filters: { status: ["ARCHIVED"] } }).success).toBe(
      false,
    );
  });

  it("rejects a page size above the cursor maximum", () => {
    expect(EventPageQuerySchema.safeParse({ pageSize: 51 }).success).toBe(false);
  });
});
