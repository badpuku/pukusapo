import { Form } from "react-router";

export default function PasswordResetUpdateRoute() {
  return (
    <main className="p-6">
      <h1 className="mb-1">リセットパスワード入力ページ</h1>
      <p>リセットするパスワードを入力する</p>
      <Form action="/auth/password-reset/update" method="post">
        <input name="password" type="password" placeholder="パスワード" />
        <button type="submit">パスワード変更</button>
      </Form>
    </main>
  );
}
