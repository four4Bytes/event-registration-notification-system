import { describe, expect, it } from "vitest";

import { initialEvents } from "@/features/events/initial-events";

import { previewClubs } from "./preview-clubs";
import { buildPreviewNotifications } from "./preview-notifications";
import { previewUsers } from "./preview-users";

describe("preview fixtures", () => {
  it("keeps club member counts in sync with the users preview", () => {
    const memberCounts = new Map<string, number>();

    for (const user of previewUsers) {
      if (user.kind !== "user" || !user.clubId) continue;
      memberCounts.set(user.clubId, (memberCounts.get(user.clubId) ?? 0) + 1);
    }

    for (const club of previewClubs) {
      expect(memberCounts.get(club.id) ?? 0).toBe(club.memberCount);
    }
  });

  it("keeps club event and notification counts in sync with the notifications preview", () => {
    const notifications = buildPreviewNotifications();

    for (const club of previewClubs) {
      const clubNotifications = notifications.filter(
        (notification) => notification.clubName === club.name,
      );
      const eventIds = new Set(
        clubNotifications.flatMap((notification) =>
          notification.eventId ? [notification.eventId] : [],
        ),
      );

      expect(clubNotifications).toHaveLength(club.notificationCount);
      expect(eventIds.size).toBe(club.eventCount);
    }
  });

  it("keeps the unread badge in sync with the notification rows", () => {
    const notifications = buildPreviewNotifications();

    expect(notifications.filter((notification) => !notification.isRead)).toHaveLength(4);
    expect(notifications[0]?.isRead).toBe(false);
  });

  it("links every notification event to a preview event", () => {
    const eventIds = new Set(initialEvents.map((event) => event.id));
    const notifications = buildPreviewNotifications();

    for (const notification of notifications) {
      if (notification.eventId) {
        expect(eventIds.has(notification.eventId)).toBe(true);
      }
    }
  });
});
