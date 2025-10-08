import { getAuth } from "@clerk/react-router/ssr.server";
import { Outlet, useLoaderData } from "react-router";

import { AdminLayout } from "~/components/layouts/adminLayout/adminLayout";
import { createServerSupabaseClient } from "~/services/supabase/client.server";
import { getProfileByUserId } from "~/services/supabase/profiles";

import type { Route } from "./+types/layout";

export const loader = async (args: Route.LoaderArgs) => {
  const supabase = createServerSupabaseClient(args);
  const auth = await getAuth(args);

  if (!auth.isAuthenticated) {
    return {
      userProfile: null,
    };
  }

  const profileResponse = auth.userId
    ? await getProfileByUserId(supabase, auth.userId)
    : null;

  return {
    userProfile: profileResponse?.data || null,
  };
};

export default function AdminLayoutRoute() {
  const { userProfile } = useLoaderData<typeof loader>();

  return (
    <AdminLayout userProfile={userProfile}>
      <Outlet />
    </AdminLayout>
  );
}
