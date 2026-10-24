import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NotificationCard } from "@/features/notifications/components/NotificationCard/NotificationCard";
import type { NotificationRow } from "@/features/notifications/queries";
import { NotificationAudience } from "@/generated/prisma/browser";

const baseNotification: NotificationRow = {
  id: "c0000000000000000000000001",
  title: "Enrollment opens next week",
  body: "Enrollment for the second semester opens on Monday, October 26. Make sure your profile and club assignment are up to date before then.",
  audience: NotificationAudience.ALL,
  clubName: null,
  clubShortName: null,
  createdAt: new Date("2026-10-01T09:00:00Z"),
  isRead: false,
};

const meta: Meta<typeof NotificationCard> = {
  component: NotificationCard,
  tags: ["autodocs"],
  args: {
    onOpen: () => undefined,
  },
};

export default meta;

type Story = StoryObj<typeof NotificationCard>;

export const Unread: Story = {
  args: {
    notification: baseNotification,
  },
};

export const Read: Story = {
  args: {
    notification: { ...baseNotification, isRead: true },
  },
};

export const ClubScoped: Story = {
  args: {
    notification: {
      ...baseNotification,
      audience: NotificationAudience.CLUB,
      clubName: "League of Information Technology Students",
      clubShortName: "LITS",
      isRead: true,
    },
  },
};
