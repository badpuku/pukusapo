import { Plus } from "lucide-react";
import { data, Link, useLoaderData } from "react-router";

import { PageTitle } from "~/components/ui/admin/pageTitle";
import { Button } from "~/components/ui/button";
import { Container } from "~/components/ui/container";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "~/components/ui/item";
import { getFacilityAccountsList } from "~/services/facilityAccounts/list.server";
import { formatDateTime } from "~/utils/date";

import type { Route } from "./+types/route";

export const loader = async (args: Route.LoaderArgs) => {
  const result = await getFacilityAccountsList(args);
  return data(
    { success: result.success, data: result.data, error: result.error },
    { status: result.status },
  );
};

export default function AdminFacilityAccountsIndexRoute() {
  const { data: accounts } = useLoaderData<typeof loader>();

  return (
    <Container className="flex-1 bg-zinc-50">
      <Container className="flex flex-col gap-8 bg-white">
        <div className="flex items-center justify-between">
          <PageTitle title="施設アカウント管理" />
          <Button asChild>
            <Link to="/admin/facility/accounts/new">
              <Plus className="mr-2 h-4 w-4" />
              新規アカウント登録
            </Link>
          </Button>
        </div>
        {accounts && accounts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {accounts.map((account) => {
              const dateLabel = account.updated_at ? "更新日時" : "作成日時";
              const dateValue = account.updated_at || account.created_at;

              return (
                <Item key={account.id} variant="outline" asChild>
                  <Link to={`/admin/facility/accounts/${account.id}`}>
                    <ItemContent>
                      <ItemTitle>
                        {account.circle_name || account.user_id}
                      </ItemTitle>
                      <div>
                        <ItemDescription>
                          ユーザーID: {account.user_id}
                        </ItemDescription>
                        {account.representative_name && (
                          <ItemDescription>
                            代表者: {account.representative_name}
                          </ItemDescription>
                        )}
                        <ItemDescription>
                          {dateLabel}: {formatDateTime(dateValue)}
                        </ItemDescription>
                      </div>
                    </ItemContent>
                  </Link>
                </Item>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">
            登録されているアカウントはありません
          </div>
        )}
      </Container>
    </Container>
  );
}
