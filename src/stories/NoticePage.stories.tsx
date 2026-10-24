import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Link } from "@/components/ui/Link/Link";
import { NoticePage } from "@/components/ui/NoticePage/NoticePage";

const meta: Meta<typeof NoticePage> = {
  component: NoticePage,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof NoticePage>;

export const AccessChanged: Story = {
  args: {
    title: "Your access has changed",
    message:
      "Your role was updated, so the admin area is no longer available. Your permissions are now up to date.",
  },
  render: (args) => (
    <NoticePage {...args}>
      <Link href="/notifications">Go to Notifications</Link>
    </NoticePage>
  ),
};
