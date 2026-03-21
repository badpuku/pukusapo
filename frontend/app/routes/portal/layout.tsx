import { Outlet, redirect } from "react-router";

import { PortalLayout } from "~/components/layouts/portalLayout/portalLayout";
import { authenticate } from "~/lib/auth/context.server";
import { getMyProfileService } from "~/services/profiles/get.server";

import type { Route } from "./+types/layout";

export const loader = async (args: Route.LoaderArgs) => {
  const authCtx = await authenticate(args);

  if (!authCtx) {
    throw redirect("/");
  }

  const profileResponse = await getMyProfileService(authCtx);

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
