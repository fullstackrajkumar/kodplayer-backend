/**
 * GCS upload defaults.
 *
 * Bucket and credentials come from env (see `gcs.config.ts`); these are limits
 * baked into the signed URL so the client cannot exceed them after signing.
 */

/** Default signed-URL TTL (5 minutes). Short on purpose: signed URLs are bearer credentials. */
export const GCS_SIGNED_URL_TTL_MS_DEFAULT = 5 * 60 * 1000;

/** Hard ceiling so misconfiguration cannot mint a long-lived URL. GCS v4 caps at 7 days. */
export const GCS_SIGNED_URL_TTL_MS_MAX = 15 * 60 * 1000;

/** Default per-upload size cap (10 MB). Enforced by GCS via signed `x-goog-content-length-range`. */
export const GCS_MAX_UPLOAD_BYTES_DEFAULT = 10 * 1024 * 1024;

/** Hard ceiling — even if env says larger, we refuse beyond this. */
export const GCS_MAX_UPLOAD_BYTES_MAX = 50 * 1024 * 1024;

/** Allowed image MIME types (only these can be signed). */
export const GCS_ALLOWED_CONTENT_TYPES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

/** Max raw filename length we accept from the client (post-sanitization is shorter). */
export const GCS_MAX_FILENAME_LENGTH = 200;

/** Public base URL for the bucket (objects in `your-app-name` are publicly readable). */
export function buildPublicUrl(bucket: string, objectKey: string): string {
  return `https://storage.googleapis.com/${encodeURIComponent(bucket)}/${objectKey
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
