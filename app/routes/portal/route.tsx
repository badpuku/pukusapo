import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "portal",
  }),
};

export default function PortalHomeRoute() {
  return (
    <>
      <h1>portal</h1>
    </>
  );
}
