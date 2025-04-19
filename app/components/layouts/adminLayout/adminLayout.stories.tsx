import type { Meta, StoryObj } from "@storybook/react";
import {
  reactRouterParameters,
  withRouter,
} from "storybook-addon-remix-react-router";

import type { AppUIMatch } from "~/route-handle";

import { AdminLayout } from "./adminLayout";

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

export const Default: Story = {
  args: {
    children: <p>ここに管理画面のコンテンツが表示されます</p>,
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
