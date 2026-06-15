export interface ApiResponseMeta {
  timestamp: string;
  path: string;
  requestId: string;
}

export interface ApiFieldError {
  field: string | null;
  message: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: ApiFieldError[];
}

export interface ApiSuccessEnvelope<T = unknown> {
  success: true;
  statusCode: number;
  /** Set per route via `@ApiSuccessResponseMessage()`; `null` when omitted. */
  message: string | null;
  data: T | null;
  meta: ApiResponseMeta;
}

export interface ApiErrorEnvelope {
  success: false;
  statusCode: number;
  error: ApiErrorBody;
  meta: ApiResponseMeta;
}
