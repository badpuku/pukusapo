import { SignOutButton } from "@clerk/react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { LogOut } from "lucide-react";
import { Outlet, redirect } from "react-router";

import { AdminLayout } from "~/components/layouts/adminLayout/adminLayout";
import { SidebarSignOutButton } from "~/components/ui/sidebar";
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

export default function PortalLayoutRoute({ loaderData }: Route.ComponentProps) {
  const { userProfile } = loaderData;
  console.log(userProfile);

  return (
    <Outlet />
  );
}
