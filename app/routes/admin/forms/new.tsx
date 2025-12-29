import { getFormProps } from "@conform-to/react";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useFetcher, useNavigate } from "react-router";

import { PageTitle } from "~/components/ui/admin/pageTitle";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { FieldGroup, FieldSet } from "~/components/ui/field";
import { FieldControl } from "~/components/ui/FieldControl";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { FORM_STATUS, type FormStatus } from "~/models/forms";
import type { RouteHandle } from "~/route-handle";

import { useFormsCreateForm } from "./useFormsCreateForm";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "新規作成",
  }),
};

export default function AdminFormsNewRoute() {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [status, setStatus] = useState<FormStatus>(FORM_STATUS.DRAFT);

  const [form, fields] = useFormsCreateForm();

  // API呼び出し成功時にリダイレクト
  useEffect(() => {
    if (fetcher.data?.success) {
      navigate("/admin/forms");
    }
  }, [fetcher.data?.success, navigate]);

  return (
    <div className="flex flex-col">
      <Container>
        <PageTitle title="新規フォーム作成" />
      </Container>
      <Container>
        <fetcher.Form
          className="max-w-2xl space-y-6"
          method="post"
          {...getFormProps(form)}
          action="/api/forms/create"
        >
          <FieldSet>
            <FieldGroup>
              <FieldControl
                label="フォームタイトル"
                htmlFor="title"
                required
                errors={fields.title.errors}
              >
                <Input id="title" name="title" required />
              </FieldControl>
              <FieldControl
                label="概要"
                htmlFor="description"
                errors={fields.description.errors}
              >
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
              onClick={() => setStatus(FORM_STATUS.DRAFT)}
              disabled={fetcher.state === "submitting"}
            >
              <Save className="mr-2 h-4 w-4" />
              下書きで保存
            </Button>
            <Button
              type="submit"
              onClick={() => setStatus(FORM_STATUS.PUBLISHED)}
              disabled={fetcher.state === "submitting"}
            >
              <Save className="mr-2 h-4 w-4" />
              公開
            </Button>
            <input type="hidden" name="status" value={status} />
            <Button type="button" variant="outline" asChild>
              <Link to="/admin/forms">キャンセル</Link>
            </Button>
          </div>
        </fetcher.Form>
      </Container>
    </div>
  );
}
