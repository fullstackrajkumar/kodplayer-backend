import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { StorageOptions } from "@google-cloud/storage";
import {
  GCS_MAX_UPLOAD_BYTES_DEFAULT,
  GCS_MAX_UPLOAD_BYTES_MAX,
  GCS_SIGNED_URL_TTL_MS_DEFAULT,
  GCS_SIGNED_URL_TTL_MS_MAX,
} from "./constants";

export interface GcsRuntimeConfig {
  bucket: string;
  signedUrlTtlMs: number;
  maxUploadBytes: number;
  storageOptions: StorageOptions;
}

/**
 * Default path (relative to the monorepo root) where a developer can drop their
 * service-account key with no env-var fiddling. The folder is gitignored.
 */
const DEFAULT_KEY_PATH = "secrets/gcs-sa-key.json";

/**
 * Resolve and validate GCS config from env. Throws a descriptive error if the
 * essentials are missing — caller should treat that as a 503 (service not
 * configured) rather than crashing the whole app at boot.
 *
 * Auth resolution (first match wins):
 *   1. `GCS_SA_KEY_JSON=<raw json | base64 of json>`             — inline (k8s/CI secrets)
 *   2. `GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/sa.json`     — standard env var
 *   3. `GCS_SA_KEY_FILE=path/to/sa.json` (abs OR relative to repo root)
 *   4. `<repo-root>/secrets/gcs-sa-key.json`                     — convention; just drop a file
 *   5. Application Default Credentials                            — only useful inside GCP (Workload Identity)
 */
export function resolveGcsConfig(): GcsRuntimeConfig {
  const bucket = (process.env.GCS_BUCKET_NAME ?? "").trim();
  if (!bucket) {
    throw new Error("GCS_BUCKET_NAME is not set");
  }

  const ttlEnv = Number(process.env.GCS_SIGNED_URL_TTL_MS);
  const ttlRaw = Number.isFinite(ttlEnv) && ttlEnv > 0 ? ttlEnv : GCS_SIGNED_URL_TTL_MS_DEFAULT;
  const signedUrlTtlMs = Math.min(ttlRaw, GCS_SIGNED_URL_TTL_MS_MAX);

  const sizeEnv = Number(process.env.GCS_MAX_UPLOAD_BYTES);
  const sizeRaw = Number.isFinite(sizeEnv) && sizeEnv > 0 ? sizeEnv : GCS_MAX_UPLOAD_BYTES_DEFAULT;
  const maxUploadBytes = Math.min(sizeRaw, GCS_MAX_UPLOAD_BYTES_MAX);

  const storageOptions: StorageOptions = {};

  const credsJson = loadServiceAccountJson();
  if (credsJson) {
    storageOptions.projectId = credsJson.project_id;
    storageOptions.credentials = {
      client_email: credsJson.client_email,
      private_key: credsJson.private_key,
    };
  } else if (process.env.GCS_PROJECT_ID) {
    storageOptions.projectId = process.env.GCS_PROJECT_ID;
  }

  return { bucket, signedUrlTtlMs, maxUploadBytes, storageOptions };
}

interface ServiceAccountKey {
  project_id: string;
  client_email: string;
  private_key: string;
}

/**
 * Locate the service-account key by walking the resolution order. Returns
 * `undefined` when nothing is found (caller falls back to ADC, which only works
 * for signing inside GCP via Workload Identity).
 */
function loadServiceAccountJson(): ServiceAccountKey | undefined {
  const inline = (process.env.GCS_SA_KEY_JSON ?? "").trim();
  if (inline) return parseInlineServiceAccount(inline);

  const explicitFiles = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.GCS_SA_KEY_FILE,
  ].filter((p): p is string => typeof p === "string" && p.trim().length > 0);

  for (const candidate of explicitFiles) {
    const abs = isAbsolute(candidate) ? candidate : resolve(repoRoot(), candidate);
    if (existsSync(abs)) {
      return parseInlineServiceAccount(readFileSync(abs, "utf8"));
    }
    // Configured but file missing — surface a clear error rather than silently falling back,
    // otherwise misconfiguration looks identical to "no creds at all".
    throw new Error(`GCS service-account key file not found: ${abs}`);
  }

  // Convention: <repo-root>/secrets/gcs-sa-key.json — used when nothing else is set.
  const conventional = resolve(repoRoot(), DEFAULT_KEY_PATH);
  if (existsSync(conventional)) {
    return parseInlineServiceAccount(readFileSync(conventional, "utf8"));
  }

  return undefined;
}

/**
 * Walk up from cwd looking for the monorepo root (`pnpm-workspace.yaml`).
 * Falls back to cwd when not found, so behaviour stays sane outside the repo.
 */
function repoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

interface ServiceAccountKey {
  project_id: string;
  client_email: string;
  private_key: string;
}

function parseInlineServiceAccount(input: string): ServiceAccountKey {
  let jsonText = input;

  // Allow base64-encoded JSON to make .env / k8s secrets less painful (no newlines / quotes to escape).
  if (!input.startsWith("{")) {
    try {
      jsonText = Buffer.from(input, "base64").toString("utf8");
    } catch {
      throw new Error("GCS_SA_KEY_JSON is not valid JSON or base64");
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("GCS_SA_KEY_JSON is not valid JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("GCS_SA_KEY_JSON must be a JSON object");
  }
  const obj = parsed as Record<string, unknown>;
  const projectId = typeof obj.project_id === "string" ? obj.project_id : "";
  const clientEmail = typeof obj.client_email === "string" ? obj.client_email : "";
  const privateKeyRaw = typeof obj.private_key === "string" ? obj.private_key : "";
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error("GCS_SA_KEY_JSON is missing project_id / client_email / private_key");
  }

  // Some deployment systems collapse `\n` into the literal characters `\` + `n`; restore them.
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
}
