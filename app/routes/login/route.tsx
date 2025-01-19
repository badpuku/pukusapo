import { Form, Link } from "@remix-run/react";

export default function LoginRoute() {
  return (
    <main className="p-6">
      <h1 className="mb-1">ログインページ</h1>
      <p>ログイン方法を二つ用意する</p>
      <Form action="/auth/signin" method="post">
        <input name="email" type="email" placeholder="sample@example.com" />
        <input name="password" type="password" placeholder="パスワード" />
        <input
          name="password_confirm"
          type="password"
          placeholder="パスワード(確認)"
        />
        <button type="submit">ログイン</button>
      </Form>
      <Link to={"/signup"}>新規登録</Link>
      <br />
      <Link to={"/reset-password"}>パスワードリセット</Link>
    </main>
  );
}
