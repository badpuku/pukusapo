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
import { getFormsList } from "~/services/forms";
import { formatDateTime } from "~/utils/date";

import type { Route } from "./+types/route";

export const loader = async (args: Route.LoaderArgs) => {
  const result = await getFormsList(args);
  return data({ success: result.success, data: result.data, error: result.error }, { status: result.status });
};

export default function AdminFormsHomeRoute() {
  const { data } = useLoaderData<typeof loader>();
  return (
    <Container className="flex-1 bg-zinc-50">
      <Container className="flex flex-col gap-8 bg-white">
        <div className="flex items-center justify-between">
          <PageTitle title="フォーム管理" />
          <Button asChild>
            <Link to="/admin/forms/new">
              <Plus className="mr-2 h-4 w-4" />
              新規フォーム作成
            </Link>
          </Button>
        </div>
        {data && (
          <div className="flex flex-col gap-4">
            {data.map((item) => {
              const dateLabel = item.updated_at ? "更新日時" : "作成日時";
              const dateValue = item.updated_at
                ? item.updated_at
                : item.created_at;

              return (
                <Item key={item.title} variant="outline" asChild>
                  <Link to={`/admin/forms/${item.id}`}>
                    <ItemContent>
                      <ItemTitle>{item.title}</ItemTitle>
                      <div>
                        <ItemDescription>{item.status}</ItemDescription>
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
        )}
      </Container>
    </Container>
  );
}
