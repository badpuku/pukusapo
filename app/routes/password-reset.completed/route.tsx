import { Link } from "react-router";

export default function PasswordResetCompletedRoute() {
  return (
    <>
      <h1>パスワードリセットが完了しました</h1>
      <Link to="/">ホームに戻る</Link>
    </>
  );
}
