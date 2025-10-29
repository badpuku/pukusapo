import { Save } from "lucide-react";
import { Link, useFetcher, useNavigate } from "react-router";

import { PageTitle } from "~/components/ui/admin/pageTitle";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { FieldGroup, FieldSet } from "~/components/ui/field";
import { FieldControl } from "~/components/ui/FieldControl";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { RouteHandle } from "~/route-handle";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "新規作成",
  }),
};

export default function AdminFormsNewRoute() {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    status: "draft" | "published",
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const requestData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      status,
    };

    fetcher.submit(JSON.stringify(requestData), {
      method: "POST",
      action: "/api/forms/create",
      encType: "application/json",
    });
  };

  // API呼び出し成功時にリダイレクト
  if (fetcher.data?.success) {
    navigate("/admin/forms");
  }

  return (
    <div className="flex flex-col">
      <Container>
        <PageTitle title="新規フォーム作成" />
      </Container>
      <Container>
        <form className="max-w-2xl space-y-6">
          <FieldSet>
            <FieldGroup>
              <FieldControl label="フォームタイトル" htmlFor="title" required>
                <Input id="title" name="title" required />
              </FieldControl>
              <FieldControl label="概要" htmlFor="description">
                <Textarea id="description" name="description" />
              </FieldControl>
            </FieldGroup>
          </FieldSet>

          {fetcher.data && !fetcher.data.success && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {fetcher.data.error.message}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              onClick={(e) =>
                handleSubmit(
                  e as unknown as React.FormEvent<HTMLFormElement>,
                  "draft",
                )
              }
              disabled={fetcher.state === "submitting"}
            >
              <Save className="mr-2 h-4 w-4" />
              下書きで保存
            </Button>
            <Button
              type="submit"
              onClick={(e) =>
                handleSubmit(
                  e as unknown as React.FormEvent<HTMLFormElement>,
                  "published",
                )
              }
              disabled={fetcher.state === "submitting"}
            >
              <Save className="mr-2 h-4 w-4" />
              公開
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/admin/forms">キャンセル</Link>
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}
