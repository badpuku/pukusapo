import { err, ResultAsync } from "neverthrow";
import type { z } from "zod";

import type { BaseAuthContext } from "~/lib/auth/types";

export interface ApiError {
  status: number;
  error: string;
}

export interface ApiClient {
  get<T>(path: string, schema: z.ZodType<T>): ResultAsync<T, ApiError>;
  post<T>(path: string, body: unknown, schema: z.ZodType<T>): ResultAsync<T, ApiError>;
  put<T>(path: string, body: unknown, schema: z.ZodType<T>): ResultAsync<T, ApiError>;
  delete(path: string): ResultAsync<void, ApiError>;
}

const extractErrorMessage = (body: unknown, status: number): string => {
  if (typeof body === "object" && body !== null && "error" in body) {
    return String((body as { error: unknown }).error);
  }
  return `HTTP ${status}`;
};

const parseErrorResponse = (response: Response): ResultAsync<never, ApiError> => {
  return ResultAsync.fromPromise(
    response.json().catch(() => ({})),
    (): ApiError => ({ status: response.status, error: `HTTP ${response.status}` }),
  ).andThen((body) =>
    err({
      status: response.status,
      error: extractErrorMessage(body, response.status),
    }),
  );
};

const fetchWithAuth = (
  baseUrl: string,
  token: string,
  path: string,
  options: RequestInit = {},
): ResultAsync<Response, ApiError> => {
  const url = new URL(path, baseUrl).toString();

  return ResultAsync.fromPromise(
    fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    }),
    (e): ApiError => ({
      status: 0,
      error: e instanceof Error ? e.message : "Network error",
    }),
  ).andThen((response) =>
    response.ok ? ResultAsync.fromSafePromise(Promise.resolve(response)) : parseErrorResponse(response),
  );
};

const parseJsonBody = <T>(
  response: Response,
  schema: z.ZodType<T>,
): ResultAsync<T, ApiError> =>
  ResultAsync.fromPromise(
    response.json() as Promise<unknown>,
    (): ApiError => ({
      status: response.status,
      error: "Invalid JSON response",
    }),
  ).andThen((body) => {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.error("API response validation failed:", parsed.error.issues);
      return err<T, ApiError>({
        status: response.status,
        error: "API response validation failed",
      });
    }
    return ResultAsync.fromSafePromise(Promise.resolve(parsed.data));
  });

const request = <T>(
  baseUrl: string,
  token: string,
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): ResultAsync<T, ApiError> =>
  fetchWithAuth(baseUrl, token, path, options).andThen((response) =>
    parseJsonBody(response, schema),
  );

const requestVoid = (
  baseUrl: string,
  token: string,
  path: string,
  options: RequestInit = {},
): ResultAsync<void, ApiError> =>
  fetchWithAuth(baseUrl, token, path, options).map(() => undefined);

export const createApiClient = (ctx: BaseAuthContext): ApiClient => {
  const baseUrl = ctx.env.API_ENDPOINT_URL;
  const token = ctx.token;

  return {
    get: <T>(path: string, schema: z.ZodType<T>) =>
      request<T>(baseUrl, token, path, schema),
    post: <T>(path: string, body: unknown, schema: z.ZodType<T>) =>
      request<T>(baseUrl, token, path, schema, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    put: <T>(path: string, body: unknown, schema: z.ZodType<T>) =>
      request<T>(baseUrl, token, path, schema, {
        method: "PUT",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    delete: (path: string) =>
      requestVoid(baseUrl, token, path, { method: "DELETE" }),
  };
};
