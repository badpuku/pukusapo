import { Outlet } from "react-router";

import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "フォーム詳細",
  }),
};

export default function PortalFormsIdRoute() {
  return <Outlet />;
}
