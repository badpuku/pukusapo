import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "forms",
  }),
};

export default function AdminFormsRoute() {
  return (
    <>
      <h1>forms</h1>
    </>
  );
}
