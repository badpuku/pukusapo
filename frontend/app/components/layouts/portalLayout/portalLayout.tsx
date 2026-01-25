import type { PropsWithChildren } from "react";

import type { ProfileResponse } from "~/services/profiles/schemas";

import { PortalBottomNav } from "./portalBottomNav";
import { PortalNavbar } from "./portalNavbar";

interface PortalLayoutProps extends PropsWithChildren {
  userProfile: ProfileResponse;
}

export const PortalLayout = ({
  children,
  userProfile,
}: PortalLayoutProps) => {
  return (
    <div>
      <PortalNavbar userProfile={userProfile} />
      <main>{children}</main>
      <PortalBottomNav userProfile={userProfile} className="md:hidden" />
    </div>
  );
};
