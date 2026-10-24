"use client";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ClubLabel } from "@/features/clubs/components/ClubLabel/ClubLabel";

const meta: Meta<typeof ClubLabel> = {
  component: ClubLabel,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "8rem" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ClubLabel>;

export const WithShortName: Story = {
  args: {
    name: "League of Information Technology Students",
    shortName: "LITS",
  },
};

export const WithoutShortName: Story = {
  args: {
    name: "League of Information Technology Students",
    shortName: null,
  },
};
