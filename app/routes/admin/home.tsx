import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "home",
  }),
};

export default function AdminHomeRoute() {
  return (
    <>
      <h1>admin</h1>
    </>
  );
}
