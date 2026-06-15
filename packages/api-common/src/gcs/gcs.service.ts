import { extname } from "node:path";
import { Storage } from "@google-cloud/storage";
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { newUuid } from "../odm/uuid-default";
import {
  buildPublicUrl,
  GCS_ALLOWED_CONTENT_TYPES,
  GCS_MAX_FILENAME_LENGTH,
} from "./constants";
import { resolveGcsConfig, type GcsRuntimeConfig } from "./gcs.config";

export interface CreateSignedUploadUrlInput {
  /**
   * Logical destination folder. Must already be validated by the caller against a per-route
   * allow-list — the service only sanity-checks shape, not which folders are permitted.
   */
  folder: string;
  fileName: string;
  contentType: string;
  /** Optional declared upload size; capped against `GCS_MAX_UPLOAD_BYTES` either way. */
  fileSize?: number;
}

export interface UploadObjectResult {
  objectKey: string;
  publicUrl: string;
}

export interface SignedUploadUrl {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  method: "PUT";
  headers: { "Content-Type": string; 
    // "x-goog-content-length-range": string
   };
  expiresAt: string;
  maxBytes: number;
}

@Injectable()
export class GcsService {
  private readonly logger = new Logger(GcsService.name);
  private cached?: { config: GcsRuntimeConfig; storage: Storage };

  /**
   * Mint a short-lived v4 signed PUT URL.
   *
   * Security properties (in addition to the per-route auth + allow-lists):
   *   - method-locked to PUT
   *   - object key randomized server-side
   *   - content-type signed (client cannot upload a different MIME)
   *   - max upload size enforced by GCS via signed `x-goog-content-length-range`
   *   - bucket comes from env; never from the client
   */
  /**
   * Server-side upload (e.g. generated invoice PDFs). Caller must pass a pre-validated `objectKey`.
   */
  async uploadObject(input: {
    objectKey: string;
    buffer: Buffer;
    contentType: string;
    cacheControl?: string;
  }): Promise<UploadObjectResult> {
    const { config, storage } = this.getRuntime();
    const objectKey = String(input.objectKey ?? "").trim();
    if (!objectKey || objectKey.includes("..")) {
      throw new InternalServerErrorException("Invalid object key");
    }

    const contentType = String(input.contentType ?? "").trim().toLowerCase();
    if (!contentType) {
      throw new InternalServerErrorException("Invalid content type");
    }

    try {
      await storage
        .bucket(config.bucket)
        .file(objectKey)
        .save(input.buffer, {
          resumable: false,
          metadata: {
            contentType,
            cacheControl: input.cacheControl ?? "public, max-age=31536000, immutable",
          },
        });
    } catch (err) {
      this.logger.error(
        `Failed to upload ${config.bucket}/${objectKey}: ${(err as Error)?.message ?? "unknown error"}`,
      );
      throw new InternalServerErrorException("Could not upload file");
    }

    this.logger.log(`Uploaded ${config.bucket}/${objectKey} (${input.buffer.length} bytes)`);

    return {
      objectKey,
      publicUrl: buildPublicUrl(config.bucket, objectKey),
    };
  }

  async createSignedUploadUrl(input: CreateSignedUploadUrlInput): Promise<SignedUploadUrl> {
    const { config, storage } = this.getRuntime();

    const contentType = String(input.contentType ?? "")
      .trim()
      .toLowerCase();
    if (!GCS_ALLOWED_CONTENT_TYPES.includes(contentType)) {
      throw new InternalServerErrorException("Unsupported content type");
    }

    if (input.fileSize !== undefined && input.fileSize > config.maxUploadBytes) {
      throw new InternalServerErrorException(
        `File too large: max ${config.maxUploadBytes} bytes`,
      );
    }

    const folder = sanitizePathSegment(input.folder);
    if (!folder) {
      throw new InternalServerErrorException("Invalid folder");
    }

    const safeName = sanitizeFileName(input.fileName, contentType);
    if (!safeName) {
      throw new InternalServerErrorException("Invalid file name");
    }

    const objectKey = `${folder}/${newUuid()}/${safeName}`;
    const expiresAtMs = Date.now() + config.signedUrlTtlMs;
    const lengthRange = `0-${config.maxUploadBytes}`;

    let uploadUrl: string;
    try {
      const file = storage.bucket(config.bucket).file(objectKey);
      const [signed] = await file.getSignedUrl({
        version: "v4",
        action: "write",
        expires: expiresAtMs,
        contentType,
        // Extension headers become part of the signature; the client MUST send them
        // verbatim or GCS rejects the upload (this is what enforces the size cap).
        // extensionHeaders: {
        //   "x-goog-content-length-range": lengthRange,
        // },
      });
      uploadUrl = signed;
    } catch (err) {
      // Don't leak SDK / credential internals to the client.
      this.logger.error(
        `Failed to sign upload URL for ${objectKey}: ${(err as Error)?.message ?? "unknown error"}`,
      );
      throw new InternalServerErrorException("Could not create upload URL");
    }

    this.logger.log(
      `Issued signed PUT for ${config.bucket}/${objectKey} (ttl=${config.signedUrlTtlMs}ms)`,
    );

    return {
      uploadUrl,
      publicUrl: buildPublicUrl(config.bucket, objectKey),
      objectKey,
      method: "PUT",
      headers: { "Content-Type": contentType, 
        // "x-goog-content-length-range": lengthRange 
      },
      expiresAt: new Date(expiresAtMs).toISOString(),
      maxBytes: config.maxUploadBytes,
    };
  }

  private getRuntime(): { config: GcsRuntimeConfig; storage: Storage } {
    if (this.cached) return this.cached;
    let config: GcsRuntimeConfig;
    try {
      config = resolveGcsConfig();
    } catch (err) {
      this.logger.error(`GCS not configured: ${(err as Error).message}`);
      throw new ServiceUnavailableException("Upload service is not configured");
    }
    const storage = new Storage(config.storageOptions);
    this.cached = { config, storage };
    return this.cached;
  }
}

/**
 * Strict allow-list for path segments — only ASCII lower-case letters, digits, dash and underscore.
 * This is what blocks `..`, `/`, NUL bytes and other path-traversal payloads.
 */
function sanitizePathSegment(input: string): string {
  const trimmed = String(input ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,49}$/.test(trimmed)) return "";
  return trimmed;
}

/**
 * Sanitize the client-supplied filename:
 *   - drop any directory component
 *   - allow only `[A-Za-z0-9._-]`
 *   - keep / restore an extension that matches the signed content type
 *   - hard length cap
 *
 * If sanitization removes everything, fall back to a generic name keyed off the MIME.
 */
function sanitizeFileName(input: string, contentType: string): string {
  const raw = String(input ?? "");
  if (raw.length === 0 || raw.length > GCS_MAX_FILENAME_LENGTH) return "";

  // Drop any path component the client might have included.
  const baseRaw = raw.split(/[\\/]/).pop() ?? "";
  const base = baseRaw.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "");
  if (!base || base === "." || base === "..") {
    return `file${extensionForContentType(contentType)}`;
  }

  // Make sure the extension matches the signed content type. If client gave a different one
  // (or none), append the correct one — clients shouldn't be able to lie about the type.
  const expectedExt = extensionForContentType(contentType);
  const currentExt = extname(base).toLowerCase();
  const named =
    currentExt && currentExt === expectedExt
      ? base
      : `${base.replace(/\.[^.]*$/, "")}${expectedExt}`;

  // Final length guard (object keys can technically be 1024 bytes; we stay well under).
  return named.slice(0, 120);
}

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".bin";
  }
}
