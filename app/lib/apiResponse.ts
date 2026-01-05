export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  status: number;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
  };
  status: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
): ApiSuccessResponse<T> {
  return { success: true, data, status };
}

export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
): ApiErrorResponse {
  return {
    success: false,
    data: null,
    error: { code, message },
    status,
  };
}
