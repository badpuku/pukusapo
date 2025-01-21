import { Link } from "@remix-run/react";

export default function PasswordResetCompletedRoute() {
  return (
    <>
      <h1>パスワードリセットが完了しました</h1>
      <Link to="/">ホームに戻る</Link>
    </>
  );
}
