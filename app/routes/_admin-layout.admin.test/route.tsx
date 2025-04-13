import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "test",
  }),
};

export default function AdminRoute() {
  return (
    <>
      <h1>admin</h1>
    </>
  );
}
