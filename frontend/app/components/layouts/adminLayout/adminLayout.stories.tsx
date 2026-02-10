import type { Meta, StoryObj } from "@storybook/react";
import { LogOut } from "lucide-react";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

import { AdminLayout } from "~/components/layouts/adminLayout/adminLayout";
import { SidebarSignOutButton } from "~/components/ui/sidebar";
import type { AppUIMatch } from "~/route-handle";
import type { ProfileResponse } from "~/services/profiles/schemas";

const meta: Meta<typeof AdminLayout> = {
  title: "Layouts/AdminLayout",
  component: AdminLayout,
  render: (args) => {
    return <AdminLayout {...args} />;
  },
  parameters: {
    layout: "fullscreen",
  },
  decorators: [withRouter],
};

export default meta;
type Story = StoryObj<typeof AdminLayout>;

const userProfile: ProfileResponse = {
  avatar_url: "https://example.com/avatar.png",
  created_at: new Date().toISOString(),
  full_name: "test user",
  id: "123",
  is_active: true,
  role_id: 3,
  updated_at: new Date().toISOString(),
  user_id: "12345",
  username: "testuser",
  roles: {
    code: "admin",
    created_at: new Date().toISOString(),
    description: "admin role",
    id: 3,
    is_active: true,
    name: "admin",
    permission_level: 10,
    updated_at: new Date().toISOString(),
  },
};

export const Default: Story = {
  args: {
    userProfile: userProfile,
    children: <p>ここに管理画面のコンテンツが表示されます</p>,
    signOutButton: <SidebarSignOutButton icon={<LogOut size={20} />} />,
  },
  parameters: {
    reactRouter: reactRouterParameters({
      routing: [
        {
          path: "/admin",
          handle: {
            breadcrumb: (match: AppUIMatch) => ({
              to: match.pathname,
              title: "ホーム",
            }),
          },
        },
      ],
    }),
  },
};
