import { Form } from "@remix-run/react";

export default function LoginRoute() {
  return (
    <main className="p-6">
      <h1 className="mb-1">ログインページ</h1>
      <p>ログイン方法を二つ用意する</p>
      <Form action="/auth/signin" method="post">
        <button type="submit">ログイン</button>
      </Form>
    </main>
  );
}
