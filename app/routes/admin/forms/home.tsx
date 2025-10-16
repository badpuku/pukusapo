import { Plus } from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";

export default function AdminFormsHomeRoute() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">フォーム管理</h1>
        <Button asChild>
          <Link to="/admin/forms/new">
            <Plus className="mr-2 h-4 w-4" />
            新規フォーム作成
          </Link>
        </Button>
      </div>
    </div>
  );
}
