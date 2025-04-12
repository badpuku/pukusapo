import { Outlet } from "react-router";

import { AdminLayout } from "~/components/layouts/adminLayout/adminLayout";

export default function AdminRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}