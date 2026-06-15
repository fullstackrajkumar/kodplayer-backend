import { BadRequestException } from "@nestjs/common";

const INVALID_PAGE_TOKEN = "Invalid pageToken";

/** RFC 4122 UUID (any version). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function encodePageToken(payload: object): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodePageToken<T extends object>(
  token: string,
  parse: (raw: Record<string, unknown>) => T,
): T {
  let raw: unknown;
  try {
    raw = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch {
    throw new BadRequestException(INVALID_PAGE_TOKEN);
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new BadRequestException(INVALID_PAGE_TOKEN);
  }
  try {
    return parse(raw as Record<string, unknown>);
  } catch {
    throw new BadRequestException(INVALID_PAGE_TOKEN);
  }
}

export function assertPageTokenUuid(value: unknown): string {
  if (typeof value !== "string") {
    throw new BadRequestException(INVALID_PAGE_TOKEN);
  }
  const trimmed = value.trim();
  if (!isUuid(trimmed)) {
    throw new BadRequestException(INVALID_PAGE_TOKEN);
  }
  return trimmed;
}

export function assertPageTokenFiniteNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new BadRequestException(INVALID_PAGE_TOKEN);
  }
  return value;
}

export function assertPageTokenString(value: unknown): string {
  if (typeof value !== "string") {
    throw new BadRequestException(INVALID_PAGE_TOKEN);
  }
  return value;
}

export function resolveCursorPageSize(
  raw: number | undefined | null,
  options: { defaultSize?: number; maxSize?: number } = {},
): number {
  const defaultSize = options.defaultSize ?? 20;
  const maxSize = options.maxSize ?? 50;
  if (raw === undefined || raw === null) return defaultSize;
  const n = Number(raw);
  if (!Number.isFinite(n)) return defaultSize;
  return Math.min(Math.max(Math.floor(n), 1), maxSize);
}

/**
 * Keyset for descending sort `{ createdAt: -1, [tieBreakUuidField]: -1 }`.
 *
 * `tieBreakUuidField` must be a top-level `Schema.Types.UUID` business id (e.g. `orderId`).
 * Do not nest `$or` under that field — Mongoose rejects it; `uuid-query.plugin` casts `$lt` to BSON only.
 */
export function keysetAfterLastCreatedAtDesc(
  tieBreakUuidField: string,
  createdAtMs: number,
  tieBreakUuid: string,
): { $or: Record<string, unknown>[] } {
  return {
    $or: [
      { createdAt: { $lt: createdAtMs } },
      { createdAt: createdAtMs, [tieBreakUuidField]: { $lt: tieBreakUuid } },
    ],
  };
}

/**
 * Keyset for ascending sort `{ [primaryField]: 1, [tieBreakUuidField]: 1 }`.
 */
export function keysetAfterLastPrimaryAsc(
  primaryField: string,
  primaryValue: string,
  tieBreakUuidField: string,
  tieBreakUuid: string,
): { $or: Record<string, unknown>[] } {
  return {
    $or: [
      { [primaryField]: { $gt: primaryValue } },
      { [primaryField]: primaryValue, [tieBreakUuidField]: { $gt: tieBreakUuid } },
    ],
  };
}
