import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "events",
  }),
};

export default function AdminEventsRoute() {
  return (
    <>
      <h1>events</h1>
    </>
  );
}
