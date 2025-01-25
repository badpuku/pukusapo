import { LoaderFunctionArgs } from "@remix-run/node";
import { Form, redirect, useLoaderData } from "@remix-run/react";

import { supabaseClient } from "~/services/supabase.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { supabase } = supabaseClient(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // ユーザ情報が取得できない場合はホームへ戻す
  if (error || !user || !user.id) {
    return redirect("/");
  }

  try {
    const { data: roleData, error: roleError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (roleError) {
      throw new Error("Failed to fetch user role");
    }

    if (roleData.role !== "admin") {
      console.error("管理者権限がありません");
      return redirect("/");
    }

    const { data, error } = await supabase.from("events").select("*");

    if (error) {
      throw new Error(error.message);
    }

    return { events: data };
  } catch (e) {
    console.error("Error fetching events:", e);
    throw new Error("Failed to fetch events");
  }
};

export default function EventsRoute() {
  const { events } = useLoaderData<typeof loader>();
  return (
    <main className="p-6">
      <h1 className="mb-1">イベント一覧ページ</h1>
      <p>登録されているイベントの一覧です。</p>
      <ul>
        {events.map((event) => (
          <li key={event.id} className="list-disc">
            <h2>{event.title}</h2>
            <p>{event.description}</p>
            <p>公開状態: {event.status}</p>
            <Form action={`/admin/events/${event.id}/edit`} method="post">
              <button>編集する</button>
            </Form>
          </li>
        ))}
      </ul>
    </main>
  );
}
