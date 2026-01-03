
import { PageTitle } from "~/components/ui/admin/pageTitle";
import { Container } from "~/components/ui/container";
import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "フォーム詳細",
  }),
};

export default function AdminFormsIdRoute() {

  return (
    <div className="flex flex-col">
      <Container>
        <PageTitle title="フォーム詳細" />
      </Container>
      
    </div>
  );
}
