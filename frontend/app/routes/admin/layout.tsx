import { SignOutButton } from "@clerk/react-router";
import { LogOut } from "lucide-react";
import { Outlet, redirect } from "react-router";

import { AdminLayout } from "~/components/layouts/adminLayout/adminLayout";
import { SidebarSignOutButton } from "~/components/ui/sidebar";
import { authenticate } from "~/lib/auth/context.server";
import { getMyProfileService } from "~/services/profiles/get.server";
import { hasModeratorPermission } from "~/utils/permissions";

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
  const permissionLevel = userProfile.role.permission_level;

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
