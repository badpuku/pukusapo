import { ArrowLeft, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import type { ProfileResponse } from "~/services/profiles/schemas";

interface PortalNavbarProps {
  userProfile: ProfileResponse;
}

export const PortalNavbar = ({ userProfile }: PortalNavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDeepPage = location.pathname !== "/portal";
  const userAvatar = userProfile.avatar_url;

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header className="fixed top-0 z-40 w-full">
      {isDeepPage && (
        <div className="absolute top-3 left-4">
          <Button
            variant="portalOutline"
            size="portalIcon"
            onClick={handleBack}
          >
            <ArrowLeft size={20} />
          </Button>
        </div>
      )}
      <div className="absolute top-3 right-4">
        <Avatar className="h-9 w-9 rounded-xl">
          <AvatarImage src={userAvatar} alt={userProfile.full_name || "User"} />
          <AvatarFallback>
            <User size={16} className="text-white" />
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
