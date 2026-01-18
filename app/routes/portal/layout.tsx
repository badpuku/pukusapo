import { getAuth } from "@clerk/react-router/ssr.server";
import { Outlet, redirect } from "react-router";

import { PortalLayout } from "~/components/layouts/portalLayout/portalLayout";
import { getProfileByUserId } from "~/services/profiles/get.server";

import type { Route } from "./+types/layout";

export const loader = async (args: Route.LoaderArgs) => {
  const auth = await getAuth(args);

  if (!auth.isAuthenticated) {
    throw redirect("/");
  }

  const profileResponse = await getProfileByUserId(args, auth.userId);

  if (!profileResponse.success) {
    throw redirect("/");
  }

  const userProfile = profileResponse.data;

  return {
    userProfile,
  };
};

export default function PortalLayoutRoute({
  loaderData,
}: Route.ComponentProps) {
  const { userProfile } = loaderData;

  return (
    <PortalLayout userProfile={userProfile}>
      <Outlet />
    </PortalLayout>
  );
}
