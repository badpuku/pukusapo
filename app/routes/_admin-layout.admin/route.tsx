import type { LoaderFunctionArgs } from "react-router";
import { Link, Outlet, useLoaderData } from "react-router";

import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "ホーム",
  }),
};

export default function AdminRoute() {
  return (
    <>
      <h1>admin</h1>
    </>
  );
}
