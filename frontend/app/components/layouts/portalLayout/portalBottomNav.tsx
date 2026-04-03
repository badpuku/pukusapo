import {
  CalendarCheck2,
  ExternalLink,
  FileText,
  Home,
  Menu,
  User,
  XIcon,
} from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import type { ProfileResponse } from "~/services/profiles/schemas";
import { hasModeratorPermission } from "~/utils/permissions";

interface PortalBottomNavProps {
  userProfile: ProfileResponse;
  className?: string;
}

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  {
    href: "/portal",
    icon: <Home size={20} />,
    label: "ホーム",
  },
  {
    href: "/portal/events",
    icon: <CalendarCheck2 size={20} />,
    label: "イベント",
  },
  {
    href: "/portal/forms",
    icon: <FileText size={20} />,
    label: "フォーム",
  },
  {
    href: "/portal/profile",
    icon: <User size={20} />,
    label: "マイページ",
  },
];

const SheetCloseButton = () => {
  return (
    <SheetClose className="absolute top-2 right-0 opacity-70 size-10 flex items-center justify-center transition-opacity hover:opacity-100 disabled:pointer-events-none">
      <XIcon className="size-5" />
    </SheetClose>
  );
};

export const PortalBottomNav = ({
  userProfile,
  className,
}: PortalBottomNavProps) => {
  const permissionLevel = userProfile.role.permission_level;
  const isModerator = hasModeratorPermission(permissionLevel);

  return (
    <div className={cn("fixed bottom-3 right-4 z-40", className)}>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="portal"
            size="portalIcon"
            className="border border-zinc-200"
          >
            <Menu className="h-5 w-5 text-white" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-xl border-0 bg-primary-800 text-white pt-14 pb-5"
          closeButton={<SheetCloseButton />}
        >
          <nav>
            <div className="flex gap-2 items-center justify-center pl-7 pr-5">
              <p className="text-xs">メニュー</p>
              <div className="flex gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <SheetClose asChild key={item.href}>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1",
                          "w-15",
                        )}
                      >
                        <span className="size-9 flex items-center justify-center text-primary-800 group-hover/link:bg-zinc-100 transition-colors duration-200 rounded-lg bg-zinc-100">
                          {Icon}
                        </span>
                        <span className="text-xs">{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </div>
            </div>
            {isModerator && (
              <div className="pt-4 px-6">
                <Link
                  to="/admin"
                  className="flex items-center justify-end gap-1 underline text-xs"
                >
                  管理画面へ
                  <ExternalLink size={16} />
                </Link>
              </div>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};
