import { CalendarCheck2 } from "lucide-react";
import { Link } from "react-router";

import { Container } from "~/components/ui/container";
import { Title } from "~/components/ui/title";
import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "portal",
  }),
};

export default function PortalHomeRoute() {
  return (
    <Container className="pt-15">
      <Title as="h1">ぷくさぽ</Title>
      <div className="mt-8">
        <Title as="h2" className="text-zinc-700">
          最新のフォーム
        </Title>
        <Link to="/portal/forms">
          <div className="flex gap-2 bg-white rounded-lg border border-zinc-200 p-4 text-zinc-900 mt-2">
            <span className="size-9 flex items-center justify-center">
              <CalendarCheck2 size={20} className="text-primary-900" />
            </span>
            <span className="grow flex flex-col">
              <p className="text-lg">12月の出席回答</p>
              <p>説明説明説明説明説明</p>
              <p>13(土), 17(水), 26(金) </p>
            </span>
            <span>
              <p>回答</p>
              <span>
                <p>未</p>
              </span>
            </span>
          </div>
        </Link>
      </div>
    </Container>
  );
}
