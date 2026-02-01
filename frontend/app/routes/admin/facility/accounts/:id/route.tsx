import { getFormProps } from "@conform-to/react";
import { Save, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { data, Link, useFetcher, useLoaderData, useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { FieldSet } from "~/components/ui/field";
import { FieldCard, FieldCardContent } from "~/components/ui/fieldCard";
import { Title } from "~/components/ui/title";
import { ERROR_CODES, ERROR_STATUS_MAP } from "~/constants/errors";
import type { RouteHandle } from "~/route-handle";
import { AccountFormFields } from "~/routes/admin/facility/accounts/features/accountForm";
import { useFacilityAccountUpdateForm } from "~/routes/admin/facility/accounts/useFacilityAccountForm";
import { getFacilityAccountById } from "~/services/facilityAccounts/get.server";

import type { Route } from "./+types/route";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "アカウント詳細",
  }),
};

export const loader = async (args: Route.LoaderArgs) => {
  const { params } = args;
  const accountId = params.id;

  const response = await getFacilityAccountById(args, accountId);

  if (!response.success) {
    throw data(response.error.message, { status: response.status });
  }

  if (!response.data) {
    throw data("アカウントが見つかりません。", {
      status: ERROR_STATUS_MAP[ERROR_CODES.RESOURCE_NOT_FOUND],
    });
  }

  return data(
    { success: true, data: response.data, error: null },
    { status: response.status },
  );
};

export default function AdminFacilityAccountsIdRoute() {
  const { data: accountData } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [form, fields] = useFacilityAccountUpdateForm({
    defaultValue: {
      userId: accountData.user_id,
      password: "",
      circleName: accountData.circle_name || "",
      representativeName: accountData.representative_name || "",
    },
  });

  // API呼び出し成功時にリダイレクト
  useEffect(() => {
    if (fetcher.data?.success) {
      navigate("/admin/facility/accounts");
    }
  }, [fetcher.data?.success, navigate]);

  const handleDelete = () => {
    if (confirm("このアカウントを削除しますか？")) {
      fetcher.submit(
        {},
        {
          method: "POST",
          action: `/api/facility-accounts/${accountData.id}/delete`,
        },
      );
    }
  };

  return (
    <div className="flex flex-col grow">
      <div className="flex grow">
        <Container className="grow bg-zinc-50">
          <fetcher.Form
            className="max-w-2xl space-y-6"
            method="post"
            {...getFormProps(form)}
            action={`/api/facility-accounts/${accountData.id}/update`}
          >
            <Title as="h3" className="mb-2">
              アカウント情報
            </Title>
            <FieldCard>
              <FieldCardContent>
                <FieldSet>
                  <AccountFormFields
                    userIdField={fields.userId}
                    passwordField={fields.password}
                    circleNameField={fields.circleName}
                    representativeNameField={fields.representativeName}
                    isEdit={true}
                  />
                </FieldSet>
              </FieldCardContent>
            </FieldCard>

            {fetcher.data && !fetcher.data.success && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {fetcher.data.error.message}
              </div>
            )}
          </fetcher.Form>
        </Container>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-zinc-200">
        <div className="flex gap-2 items-center px-6 py-4">
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to="/admin/facility/accounts">キャンセル</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={fetcher.state === "submitting"}
          >
            <Trash2 className="size-4" />
            削除
          </Button>
          <Button
            form={form.id}
            type="submit"
            disabled={fetcher.state === "submitting"}
          >
            <Save className="size-4" />
            更新
          </Button>
        </div>
      </div>
    </div>
  );
}
