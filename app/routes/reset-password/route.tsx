import { Form } from "@remix-run/react";

export default function ResetPasswordRoute() {
  return (
    <main className="p-6">
      <h1 className="mb-1">パスワードリセットページ</h1>
      <p>パスワードリセットをおこなうアカウントのメールアドレスを入力する</p>
      <Form action="/auth/password-reset/send" method="post">
        <input name="email" type="email" placeholder="sample@example.com" />
        <button type="submit">パスワード変更メール送信</button>
      </Form>
    </main>
  );
}
