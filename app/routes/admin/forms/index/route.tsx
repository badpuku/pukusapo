import { getAuth } from "@clerk/react-router/ssr.server";
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
import {
  ERROR_CODES,
  ERROR_MESSAGES_MAP,
  ERROR_STATUS_MAP,
} from "~/constants/errors";
import { FormsListSchema } from "~/routes/api/forms/list/route";
import { formatDateTime } from "~/utils/date";

import type { Route } from "./+types/route";

export const loader = async (args: Route.LoaderArgs) => {
  const auth = await getAuth(args);
  const token = await auth.getToken();
  const response = await fetch(`${args.context.cloudflare.env.API_ENDPOINT_URL}/api/forms/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const jsonData = await response.json();
  console.log(jsonData);
  const parsedResponse = FormsListSchema.safeParse(jsonData);
  if (!parsedResponse.success) {
    return data(
      {
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: ERROR_MESSAGES_MAP[ERROR_CODES.VALIDATION_ERROR],
        },
      },
      { status: ERROR_STATUS_MAP[ERROR_CODES.VALIDATION_ERROR] },
    );
  }
  return data(
    {
      ...parsedResponse.data,
    },
    { status: 200 },
  );
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
