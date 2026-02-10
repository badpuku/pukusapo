import { Outlet } from "react-router";

import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "施設",
  }),
};

export default function AdminFacilityRoute() {
  return <Outlet />;
}
