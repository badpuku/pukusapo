/**
 * 予約システムからの 5xx エラー（主に 503）を表すカスタムエラー
 */
export class ServerError extends Error {
  public readonly statusCode: number;

  constructor(statusCode = 503, message?: string) {
    super(message ?? `サーバーエラー (${statusCode})`);
    this.name = "ServerError";
    this.statusCode = statusCode;
  }
}
