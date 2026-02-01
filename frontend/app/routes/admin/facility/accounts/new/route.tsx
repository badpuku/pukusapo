import { getFormProps } from "@conform-to/react";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { Link, useFetcher, useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import { FieldSet } from "~/components/ui/field";
import { FieldCard, FieldCardContent } from "~/components/ui/fieldCard";
import { Title } from "~/components/ui/title";
import type { RouteHandle } from "~/route-handle";
import { AccountFormFields } from "~/routes/admin/facility/accounts/features/accountForm";
import { useFacilityAccountForm } from "~/routes/admin/facility/accounts/useFacilityAccountForm";

export const handle: RouteHandle = {
  breadcrumb: (match) => ({
    to: match.pathname,
    title: "アカウント新規登録",
  }),
};

export default function AdminFacilityAccountsNewRoute() {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const [form, fields] = useFacilityAccountForm({
    defaultValue: {
      userId: "",
      password: "",
      circleName: "",
      representativeName: "",
    },
  });

  // API呼び出し成功時にリダイレクト
  useEffect(() => {
    if (fetcher.data?.success) {
      navigate("/admin/facility/accounts");
    }
  }, [fetcher.data?.success, navigate]);

  return (
    <div className="flex flex-col grow">
      <div className="flex grow">
        <Container className="grow bg-zinc-50">
          <fetcher.Form
            className="max-w-2xl space-y-6"
            method="post"
            {...getFormProps(form)}
            action="/api/facility-accounts/create"
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
                    isEdit={false}
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
            form={form.id}
            type="submit"
            disabled={fetcher.state === "submitting"}
          >
            <Save className="size-4" />
            登録
          </Button>
        </div>
      </div>
    </div>
  );
}
