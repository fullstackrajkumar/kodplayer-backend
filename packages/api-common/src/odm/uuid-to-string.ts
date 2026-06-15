const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Canonical RFC-4122 string from a 16-byte BSON UUID buffer. */
function bufferToCanonicalUuid(buf: Buffer): string {
  if (buf.length !== 16) {
    throw new TypeError(`BSON UUID buffer must be 16 bytes, got ${buf.length}`);
  }
  const hex = buf.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function bufferPojoToUuid(value: { type: string; data: number[] }): string {
  return bufferToCanonicalUuid(Buffer.from(value.data));
}

/** BSON `Binary` from `document.toObject()` on UUID fields (subtype 4, 16 bytes). */
function bsonBinaryToUuid(value: { buffer: Buffer }): string {
  return bufferToCanonicalUuid(value.buffer);
}

function isBufferPojo(value: object): value is { type: string; data: number[] } {
  const o = value as { type?: unknown; data?: unknown };
  return o.type === "Buffer" && Array.isArray(o.data);
}

function isBsonUuidBinary(value: object): value is { buffer: Buffer } {
  const buf = (value as { buffer?: unknown }).buffer;
  return Buffer.isBuffer(buf) && buf.length === 16;
}

/**
 * Normalizes a top-level `Schema.Types.UUID` value to its canonical string form.
 * Lean MongoDB reads return BSON UUID as `Buffer`; `toObject()` returns BSON `Binary`.
 */
export function uuidToString(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (Buffer.isBuffer(value)) {
    return bufferToCanonicalUuid(value);
  }
  if (typeof value === "object") {
    if (isBufferPojo(value)) {
      return bufferPojoToUuid(value);
    }
    if (isBsonUuidBinary(value)) {
      return bsonBinaryToUuid(value);
    }
    const o = value as { toJSON?: () => unknown };
    if (typeof o.toJSON === "function") {
      const json = o.toJSON();
      if (typeof json === "string" && UUID_RE.test(json)) {
        return json;
      }
    }
    const s = String(value);
    if (UUID_RE.test(s)) {
      return s;
    }
  }
  const fallback = String(value);
  if (UUID_RE.test(fallback)) {
    return fallback;
  }
  throw new TypeError(`Expected UUID string or BSON UUID buffer, got ${typeof value}`);
}
