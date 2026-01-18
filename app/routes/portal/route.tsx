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
    </Container>
  );
}
