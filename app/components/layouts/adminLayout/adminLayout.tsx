import {
  CalendarCheck2,
  ClipboardSignature,
  Home,
  LogOut,
  User,
  Users,
} from "lucide-react";
import { Fragment, type PropsWithChildren } from "react";
import { Link, useMatches } from "react-router";

import { IconPuku } from "~/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import {
  Sidebar,
  SidebarContent,
  SidebarContentBottom,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuLinkButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import type { AppUIMatch } from "~/route-handle";

type SidebarMenuItem = {
  to: string;
  icon: React.ReactNode;
  label: string;
};

const sidebarMenuItems: SidebarMenuItem[] = [
  {
    to: "/",
    icon: <Home size={20} />,
    label: "ホーム",
  },
  {
    to: "/events",
    icon: <CalendarCheck2 size={20} />,
    label: "イベント",
  },
  {
    to: "/forms",
    icon: <ClipboardSignature size={20} />,
    label: "フォーム",
  },
  {
    to: "/users",
    icon: <Users size={20} />,
    label: "ユーザー",
  },
];

const AdminSidebar = () => {
  // https://github.com/shadcn.png
  const userAvatar = "";

  return (
    <Sidebar className="border-r-zinc-200">
      <SidebarHeader className="p-4 items-center">
        <div
          className={cn(
            "size-8 rounded-lg bg-primary-500 flex items-center justify-center text-white",
          )}
        >
          <IconPuku width={20} height={20} />
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-3 px-2 pb-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-3">
              {sidebarMenuItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuLinkButton
                    to={item.to}
                    icon={item.icon}
                    label={item.label}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarContentBottom>
          <SidebarMenuLinkButton to="/logout" icon={<LogOut size={20} />} />
        </SidebarContentBottom>
      </SidebarContent>
      <SidebarFooter className="py-3">
        <SidebarSeparator className="mx-auto data-[orientation=horizontal]:w-9" />
        <Link to="/profile" className="p-2 flex justify-center">
          <Avatar className="size-7">
            <AvatarImage src={userAvatar} />
            <AvatarFallback>
              <User size={20} className="text-white" />
            </AvatarFallback>
          </Avatar>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
};

const AdminNavbar = () => {
  const matches = useMatches() as AppUIMatch[];

  console.log(matches);

  return (
    <div className="sticky top-0 w-full h-16 px-4 py-[10px] flex items-center gap-4 border-b border-zinc-200 bg-white">
      <SidebarTrigger className="cursor-pointer hover:bg-zinc-100 duration-200" />
      <Breadcrumb className="px-4 py-1 border-l border-zinc-200">
        <BreadcrumbList>
          {matches
            .filter((match) => match.handle?.breadcrumb)
            .map((match, index, array) => {
              const breadcrumb = match.handle?.breadcrumb?.(
                match,
                index,
                array,
              );
              const isCurrent = index === array.length - 1;

              return (
                <Fragment key={match.id}>
                  <BreadcrumbItem>
                    {isCurrent ? (
                      <BreadcrumbPage className="text-xs">
                        {breadcrumb?.title || match.pathname}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        {breadcrumb && (
                          <Link
                            to={breadcrumb.to}
                            className="text-xs text-zinc-500"
                          >
                            {breadcrumb.title}
                          </Link>
                        )}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isCurrent && (
                    <BreadcrumbSeparator className="text-zinc-500" />
                  )}
                </Fragment>
              );
            })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

const AdminMain = ({ children }: PropsWithChildren) => {
  return (
    <main className="h-svh flex-1 bg-zinc-100">
      <AdminNavbar />
      <div className="p-4 overflow-y-auto">{children}</div>
    </main>
  );
};

export const AdminLayout = ({ children }: PropsWithChildren) => {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <AdminMain>{children}</AdminMain>
    </SidebarProvider>
  );
};
