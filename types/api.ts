export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}
