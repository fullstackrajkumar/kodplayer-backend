import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import type { ServiceAccount } from "firebase-admin";

/**
 * `FIREBASE_SERVICE_ACCOUNT_JSON` resolution (first match):
 *   1. Raw JSON string (`{...}`)
 *   2. Path to a `.json` file (absolute or relative to cwd)
 *   3. Base64-encoded JSON (same as `GCS_SA_KEY_JSON`)
 */
export function parseFirebaseServiceAccount(rawInput: string): ServiceAccount {
  const input = rawInput.trim();
  if (!input) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is empty");
  }

  let jsonText: string;
  if (input.startsWith("{")) {
    jsonText = input;
  } else if (existsSync(resolveFilePath(input))) {
    jsonText = readFileSync(resolveFilePath(input), "utf8").trim();
  } else {
    try {
      jsonText = Buffer.from(input, "base64").toString("utf8");
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON, file path, or base64",
      );
    }
  }

  if (!jsonText.startsWith("{")) {
    try {
      jsonText = Buffer.from(jsonText, "base64").toString("utf8");
    } catch {
      // file may contain base64 only
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must be a JSON object");
  }

  const obj = parsed as Record<string, unknown>;
  const projectId = typeof obj.project_id === "string" ? obj.project_id : "";
  const clientEmail = typeof obj.client_email === "string" ? obj.client_email : "";
  const privateKeyRaw = typeof obj.private_key === "string" ? obj.private_key : "";
  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is missing project_id / client_email / private_key",
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
  };
}

function resolveFilePath(candidate: string): string {
  return isAbsolute(candidate) ? candidate : resolve(process.cwd(), candidate);
}
