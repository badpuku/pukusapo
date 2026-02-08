import { Link } from "react-router";

import { PageTitle } from "~/components/ui/admin/pageTitle";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";

export default function AdminFacilityIndexRoute() {
  return (
    <Container className="flex-1 bg-zinc-50">
      <Container className="flex flex-col gap-8 bg-white">
        <PageTitle title="施設" />
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/admin/facility/accounts">
              アカウント管理
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/facility/collection-jobs">
              結果収集ジョブ
            </Link>
          </Button>
        </div>
      </Container>
    </Container>
  );
}