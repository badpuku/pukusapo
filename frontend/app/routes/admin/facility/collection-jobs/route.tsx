import { Outlet } from "react-router";

import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "予約結果収集ジョブ一覧",
  }),
};

export default function AdminFacilityCollectionJobsRoute() {
  return <Outlet />;
}
