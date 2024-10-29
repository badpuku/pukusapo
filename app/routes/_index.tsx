import { type MetaFunction, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, Form, json, useLoaderData } from "@remix-run/react";
import { supabaseClient } from "~/services/supabase.server";


export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async({ request }: LoaderFunctionArgs) => {
  const { supabase } = supabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  return json({ user });
}

export default function Index() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <h1>トップページ</h1>
      {user && <p>Welcome, {user.id}</p>}
      <Link to={"/login"}>ログインページへ</Link>
      <Form action="/auth/signout" method="post">
        <button type="submit">ログアウト</button>
      </Form>
    </>
  );
}
