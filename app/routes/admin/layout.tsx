import { Outlet } from "react-router";

import { AdminLayout } from "~/components/layouts/adminLayout/adminLayout";

export default function AdminLayoutRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}