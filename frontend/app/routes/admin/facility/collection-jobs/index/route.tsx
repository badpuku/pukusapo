import { Link, useLoaderData } from "react-router";

import { PageTitle } from "~/components/ui/admin/pageTitle";
import { Container } from "~/components/ui/container";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "~/components/ui/item";
import { loader as collectionJobsLoader } from "~/routes/api/facility/collection-jobs/loader.server";
import { formatDateTime } from "~/utils/date";

export const loader = collectionJobsLoader;

export default function AdminFacilityCollectionJobsIndexRoute() {
  const { data } = useLoaderData<typeof loader>();

  return (
    <Container className="flex-1 bg-zinc-50">
      <Container className="flex flex-col gap-8 bg-white">
        <div className="flex items-center justify-between">
          <PageTitle title="予約結果収集ジョブ一覧" />
        </div>
        {data && data.collectionJobs.length > 0 ? (
          <div className="flex flex-col gap-4">
            {data.collectionJobs.map((collectionJob) => {
              const id = collectionJob.id;
              const statusLabel = collectionJob.status === "running" ? "実行中" : collectionJob.status === "completed" ? "完了" : "失敗";
              const createdAt = collectionJob.created_at;

              return (
                <Item key={id} variant="outline" asChild>
                  <Link to={`/admin/facility/collection-jobs/${id}`}>
                    <ItemContent>
                      <ItemTitle>
                        {id}
                      </ItemTitle>
                      <div>
                        <ItemDescription>
                          ステータス: {statusLabel}
                        </ItemDescription>
                        <ItemDescription>
                          作成日時: {formatDateTime(createdAt)}
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
            収集ジョブはありません
          </div>
        )}
      </Container>
    </Container>
  );
}
