import { randomUUID } from "node:crypto";
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { API_SUCCESS_RESPONSE_MESSAGE_KEY } from "./api-success-response-message.decorator";
import type { ApiResponseMeta, ApiSuccessEnvelope } from "./http-envelope.types";
import { shouldSkipHttpEnvelope } from "./skip-envelope";

function requestPath(request: { path?: string; url: string }): string {
  if (typeof request.path === "string" && request.path.length > 0) {
    return request.path;
  }
  return request.url.split("?")[0] || "/";
}

function buildMeta(request: { path?: string; url: string; headers?: unknown }): ApiResponseMeta {
  const path = requestPath(request);
  const headers = request.headers as Record<string, string | string[] | undefined> | undefined;
  const rid = headers?.["x-request-id"];
  const requestId =
    typeof rid === "string" && rid.trim().length > 0 ? rid.trim() : randomUUID();
  return {
    timestamp: new Date().toISOString(),
    path,
    requestId,
  };
}

function isStreamLike(value: unknown): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    "pipe" in value &&
    typeof (value as { pipe?: unknown }).pipe === "function"
  );
}

function isAlreadySuccessEnvelope(value: unknown): value is ApiSuccessEnvelope {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    o.success === true &&
    typeof o.statusCode === "number" &&
    "data" in o &&
    "meta" in o &&
    !!o.meta &&
    typeof o.meta === "object"
  );
}

@Injectable()
export class SuccessEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<{ path?: string; url: string; headers?: unknown }>();
    const response = http.getResponse<{ statusCode: number; headersSent?: boolean }>();

    if (shouldSkipHttpEnvelope(requestPath(request))) {
      return next.handle();
    }

    const controllerMessage = this.reflector.getAllAndOverride<string | undefined>(
      API_SUCCESS_RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data: unknown) => {
        if (response.headersSent) {
          return data;
        }

        const statusCode = response.statusCode || HttpStatus.OK;

        if (statusCode === HttpStatus.NO_CONTENT || statusCode === HttpStatus.NOT_MODIFIED) {
          return data;
        }

        if (isStreamLike(data) || Buffer.isBuffer(data)) {
          return data;
        }

        if (isAlreadySuccessEnvelope(data)) {
          return {
            ...data,
            message: controllerMessage ?? data.message ?? null,
          };
        }

        const envelope: ApiSuccessEnvelope = {
          success: true,
          statusCode,
          message: controllerMessage ?? null,
          data: data === undefined ? null : data,
          meta: buildMeta(request),
        };
        return envelope;
      }),
    );
  }
}
