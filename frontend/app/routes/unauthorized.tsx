import { Link } from "react-router";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-bold text-red-600">403</h1>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            アクセスが拒否されました
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            このページにアクセスする権限がありません。
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-sm text-gray-500">
            管理者画面にアクセスするには、モデレーター以上の権限が必要です。
            <br />
            権限が必要な場合は、システム管理者にお問い合わせください。
          </p>

          <Link
            to="/"
            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
