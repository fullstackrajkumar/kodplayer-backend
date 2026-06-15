import { randomUUID } from "node:crypto";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { ApiErrorBody, ApiErrorEnvelope, ApiFieldError, ApiResponseMeta } from "./http-envelope.types";
import { shouldSkipHttpEnvelope } from "./skip-envelope";

const STATUS_TO_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.PAYMENT_REQUIRED]: "PAYMENT_REQUIRED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.METHOD_NOT_ALLOWED]: "METHOD_NOT_ALLOWED",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.GONE]: "GONE",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "UNPROCESSABLE_ENTITY",
  [HttpStatus.TOO_MANY_REQUESTS]: "TOO_MANY_REQUESTS",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "INTERNAL_SERVER_ERROR",
  [HttpStatus.NOT_IMPLEMENTED]: "NOT_IMPLEMENTED",
  [HttpStatus.BAD_GATEWAY]: "BAD_GATEWAY",
  [HttpStatus.SERVICE_UNAVAILABLE]: "SERVICE_UNAVAILABLE",
  [HttpStatus.GATEWAY_TIMEOUT]: "GATEWAY_TIMEOUT",
};

function statusToCode(status: number): string {
  return STATUS_TO_CODE[status] ?? `HTTP_${status}`;
}

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

function parseNestHttpExceptionBody(
  status: number,
  body: string | Record<string, unknown>,
): ApiErrorBody {
  const code = statusToCode(status);

  if (typeof body === "string") {
    return { code, message: body };
  }

  const messageRaw = body.message;
  const fieldErrors: ApiFieldError[] = [];

  if (Array.isArray(messageRaw)) {
    for (const item of messageRaw) {
      fieldErrors.push({ field: null, message: String(item) });
    }
    return {
      code,
      message: fieldErrors.length > 0 ? "Validation failed" : code.replace(/_/g, " "),
      ...(fieldErrors.length > 0 ? { fieldErrors } : {}),
    };
  }

  if (typeof messageRaw === "string" && messageRaw.length > 0) {
    return { code, message: messageRaw };
  }

  if (messageRaw && typeof messageRaw === "object" && !Array.isArray(messageRaw)) {
    for (const [field, val] of Object.entries(messageRaw as Record<string, unknown>)) {
      if (Array.isArray(val)) {
        for (const item of val) {
          fieldErrors.push({ field, message: String(item) });
        }
      } else if (val != null) {
        fieldErrors.push({ field, message: String(val) });
      }
    }
    return {
      code,
      message: fieldErrors.length > 0 ? "Validation failed" : code.replace(/_/g, " "),
      ...(fieldErrors.length > 0 ? { fieldErrors } : {}),
    };
  }

  const err = body.error;
  if (typeof err === "string" && err.length > 0) {
    return { code, message: err };
  }

  return { code, message: statusToCode(status).replace(/_/g, " ") };
}

@Catch()
export class ApiHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== "http") {
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status(code: number): { json(body: unknown): void };
      headersSent?: boolean;
    }>();
    const request = ctx.getRequest<{ path?: string; url: string; headers?: unknown }>();

    if (response.headersSent) {
      return;
    }

    const path = requestPath(request);
    const skipEnvelope = shouldSkipHttpEnvelope(path);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resBody = exception.getResponse();

      if (skipEnvelope) {
        if (typeof resBody === "string") {
          response.status(status).json({ statusCode: status, message: resBody });
          return;
        }
        response.status(status).json(resBody);
        return;
      }

      const error = parseNestHttpExceptionBody(status, resBody as string | Record<string, unknown>);
      const envelope: ApiErrorEnvelope = {
        success: false,
        statusCode: status,
        error,
        meta: buildMeta(request),
      };
      response.status(status).json(envelope);
      return;
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const isProd = process.env.NODE_ENV === "production";
    const devMessage =
      exception instanceof Error ? exception.message : "Internal server error";
    this.logger.error(devMessage, exception instanceof Error ? exception.stack : undefined);

    if (skipEnvelope) {
      response
        .status(status)
        .json({ statusCode: status, message: isProd ? "Internal server error" : devMessage });
      return;
    }

    const envelope: ApiErrorEnvelope = {
      success: false,
      statusCode: status,
      error: {
        code: statusToCode(status),
        message: isProd ? "Internal server error" : devMessage,
      },
      meta: buildMeta(request),
    };
    response.status(status).json(envelope);
  }
}
