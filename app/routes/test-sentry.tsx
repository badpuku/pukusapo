import * as Sentry from "@sentry/react";
import { useState } from "react";

export default function TestSentryRoute() {
  const [error, setError] = useState<string>("");

  const throwError = () => {
    throw new Error("テスト用のエラーです - Sentryで捕捉されるはずです");
  };

  const captureException = () => {
    try {
      throw new Error("手動でキャプチャされたエラーです");
    } catch (error) {
      Sentry.captureException(error);
      setError("エラーがSentryに送信されました");
    }
  };

  const captureMessage = () => {
    Sentry.captureMessage("テストメッセージがSentryに送信されました", "info");
    setError("メッセージがSentryに送信されました");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sentry テストページ</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">エラーテスト</h2>
          <p className="text-gray-600 mb-4">
            以下のボタンをクリックして、Sentryが正しく動作することを確認してください。
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={throwError}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            エラーを投げる（未処理エラー）
          </button>

          <button
            onClick={captureException}
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            エラーを手動キャプチャ
          </button>

          <button
            onClick={captureMessage}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            メッセージを送信
          </button>
        </div>

        {error && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">確認方法：</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Sentryのダッシュボードにログインしてください</li>
            <li>プロジェクトを選択してください</li>
            <li>
              「Issues」セクションでエラーが記録されていることを確認してください
            </li>
            <li>
              「Performance」セクションでトランザクションが記録されていることを確認してください
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
