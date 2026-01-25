import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "users",
  }),
};

export default function AdminUsersRoute() {
  return (
    <>
      <h1>users</h1>
    </>
  );
}
