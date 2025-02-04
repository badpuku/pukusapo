import { Form } from "react-router";

export default function SignupRoute() {
  return (
    <main className="p-6">
      <h1 className="mb-1">サインアップページ</h1>
      <p>メールアドレス&パスワード認証用のフォーム</p>
      <Form action="/auth/signup" method="post">
        <input name="email" type="email" placeholder="sample@example.com" />
        <input name="password" type="password" placeholder="パスワード" />
        <button type="submit">登録</button>
      </Form>
    </main>
  );
}
