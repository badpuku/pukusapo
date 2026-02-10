import { Outlet } from "react-router";

import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "施設アカウント一覧",
  }),
};

export default function AdminFacilityAccountsRoute() {
  return <Outlet />;
}
