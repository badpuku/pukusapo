import { SignOutButton } from "@clerk/react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { LogOut } from "lucide-react";
import { Outlet, redirect } from "react-router";

import { AdminLayout } from "~/components/layouts/adminLayout/adminLayout";
import { SidebarSignOutButton } from "~/components/ui/sidebar";
import { getProfileByUserId } from "~/services/profiles/get.server";
import { hasModeratorPermission } from "~/utils/permissions";

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
  const permissionLevel = userProfile.roles.permission_level;

  if (!hasModeratorPermission(permissionLevel)) {
    throw redirect("/unauthorized");
  }

  return {
    userProfile,
  };
};

export default function AdminLayoutRoute({ loaderData }: Route.ComponentProps) {
  const { userProfile } = loaderData;

  return (
    <AdminLayout
      userProfile={userProfile}
      // NOTE: Clerk の SignOutButton を AdminLayout 内で使用すると、Storybook でエラーが発生するため、コンポーネント外から提供する
      signOutButton={
        <SignOutButton>
          <SidebarSignOutButton icon={<LogOut size={20} />} />
        </SignOutButton>
      }
    >
      <Outlet />
    </AdminLayout>
  );
}
