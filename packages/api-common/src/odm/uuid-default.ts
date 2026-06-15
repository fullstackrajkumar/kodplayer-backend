import { randomUUID } from "node:crypto";

/** Default factory for business-key UUID string fields (not Mongo `_id`). */
export function newUuid(): string {
  return randomUUID();
}
