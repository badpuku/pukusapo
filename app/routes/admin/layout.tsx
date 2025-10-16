import { getAuth } from "@clerk/react-router/ssr.server";
import { Outlet, redirect } from "react-router";

import { AdminLayout } from "~/components/layouts/adminLayout/adminLayout";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { getProfileByUserId } from "~/services/supabase/profiles";
import { hasModeratorPermission } from "~/utils/permissions";

import type { Route } from "./+types/layout";

export const loader = async (args: Route.LoaderArgs) => {
  const supabase = createServerSupabaseClient(args);
  const auth = await getAuth(args);

  if (!auth.isAuthenticated) {
    throw redirect("/");
  }

  const profileResponse = auth.userId
    ? await getProfileByUserId(supabase, auth.userId)
    : null;

  if (!profileResponse?.data) {
    throw redirect("/");
  }

  const userProfile = profileResponse.data;
  const permissionLevel = userProfile.roles?.permission_level;

  if (!hasModeratorPermission(permissionLevel)) {
    throw redirect("/unauthorized");
  }

  return {
    userProfile,
  };
};

export default function AdminLayoutRoute({loaderData}: Route.ComponentProps) {
  const { userProfile } = loaderData;

  return (
    <AdminLayout userProfile={userProfile}>
      <Outlet />
    </AdminLayout>
  );
}
