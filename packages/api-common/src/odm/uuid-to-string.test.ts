import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";
import { createSchema } from "./schema.helper";
import { uuidToString } from "./uuid-to-string";
import { uuidField } from "./uuid-fields";

describe("uuidToString", () => {
  it("returns canonical string for BSON UUID buffer", () => {
    const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    const buf = Buffer.from(id.replace(/-/g, ""), "hex");
    assert.equal(uuidToString(buf), id);
  });

  it("passes through string UUIDs", () => {
    const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    assert.equal(uuidToString(id), id);
  });

  it("normalizes BSON Binary from document.toObject()", () => {
    const schema = createSchema({ orderId: uuidField({ unique: true }) });
    const Model = mongoose.model(`UuidToStringTest_${Date.now()}`, schema);
    const doc = new Model({});
    const binary = doc.toObject().orderId as { buffer: Buffer };
    const id = uuidToString(binary);
    assert.match(id, /^[0-9a-f-]{36}$/i);
    assert.equal(uuidToString(binary), id);
  });

  it("normalizes serialized Buffer POJO", () => {
    const id = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    const data = [...Buffer.from(id.replace(/-/g, ""), "hex")];
    assert.equal(uuidToString({ type: "Buffer", data }), id);
  });
});
