import { Container } from "~/components/ui/container";
import { PageTitle } from "~/components/ui/admin/pageTitle";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { Plus } from "lucide-react";

export default function AdminFacilityIndexRoute() {
  return (
    <Container className="flex-1 bg-zinc-50">
      <Container className="flex flex-col gap-8 bg-white">
        <PageTitle title="施設" />
        <div>
          <Button asChild>
            <Link to="/admin/facility/accounts">
              アカウント管理
            </Link>
          </Button>
        </div>
      </Container>
    </Container>
  );
}