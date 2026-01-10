import { getFormProps, getInputProps } from "@conform-to/react";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import {
  data,
  Link,
  useFetcher,
  useLoaderData,
  useNavigate,
} from "react-router";

import { PageTitle } from "~/components/ui/admin/pageTitle";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { FieldGroup, FieldSet } from "~/components/ui/field";
import { FieldControl } from "~/components/ui/fieldControl";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { ERROR_CODES, ERROR_STATUS_MAP } from "~/constants/errors";
import { FORM_STATUS, type FormStatus } from "~/models/forms";
import type { RouteHandle } from "~/route-handle";
import { useFormsForm } from "~/routes/admin/forms/useFormsForm";
import { getFormById } from "~/services/forms/get.server";

import type { Route } from "./+types/route";

export const handle: RouteHandle = {
  breadcrumb: (match) => {
    return {
      to: match.pathname,
      title: "フォーム詳細",
    };
  },
};

export const loader = async (args: Route.LoaderArgs) => {
  const { params } = args;
  const formId = params.id;

  const response = await getFormById(args, formId);

  if (!response.success) {
    throw data(response.error.message, { status: response.status });
  }

  if (!response.data) {
    throw data("フォームが見つかりません。", {
      status: ERROR_STATUS_MAP[ERROR_CODES.RESOURCE_NOT_FOUND],
    });
  }

  return data(
    { success: true, data: response.data, error: null },
    { status: response.status },
  );
};

export default function AdminFormsIdRoute() {
  const { data: formData } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [status, setStatus] = useState<FormStatus>(formData.status);

  const [form, fields] = useFormsForm({
    defaultValue: {
      title: formData.title,
      description: formData.description || "",
      status: formData.status,
    },
  });

  // API呼び出し成功時にリダイレクト
  useEffect(() => {
    if (fetcher.data?.success) {
      navigate("/admin/forms");
    }
  }, [fetcher.data?.success, navigate]);

  return (
    <div className="flex flex-col">
      <Container>
        <PageTitle title="フォーム詳細" />
      </Container>
      <Container>
        <fetcher.Form
          className="max-w-2xl space-y-6"
          method="post"
          {...getFormProps(form)}
          action={`/api/forms/${formData.id}/update`}
        >
          <FieldSet>
            <FieldGroup>
              <FieldControl
                label="フォームタイトル"
                htmlFor="title"
                required
                errors={fields.title.errors}
              >
                <Input
                  {...getInputProps(fields.title, { type: "text" })}
                  required
                />
              </FieldControl>
              <FieldControl
                label="概要"
                htmlFor="description"
                errors={fields.description.errors}
              >
                <Textarea
                  {...getInputProps(fields.description, { type: "text" })}
                />
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
