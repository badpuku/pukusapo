import { Plus } from "lucide-react";
import { Link } from "react-router";

import { PageTitle } from "~/components/ui/admin/pageTitle";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";

export default function AdminFormsHomeRoute() {
  return (
    <>
      <Container>
        <div className="flex items-center justify-between">
          <PageTitle title="フォーム管理" />
          <Button asChild>
            <Link to="/admin/forms/new">
              <Plus className="mr-2 h-4 w-4" />
              新規フォーム作成
            </Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
