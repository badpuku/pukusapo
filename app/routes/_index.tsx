import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { Form, Link, useLoaderData } from "react-router";

import { Button } from "~/components/ui/button";
import { supabaseClient } from "~/services/supabase.server";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  const { supabase } = supabaseClient(request, context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user };
};

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
      <div>
        <Button>Click me</Button>
      </div>
    </>
  );
}
