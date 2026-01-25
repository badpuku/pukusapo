import { Outlet } from "react-router";

import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "フォーム一覧",
  }),
};

export default function AdminFormsRoute() {
  return <Outlet />;
}
