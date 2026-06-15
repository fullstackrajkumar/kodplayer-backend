import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decodePageToken,
  encodePageToken,
  keysetAfterLastCreatedAtDesc,
  keysetAfterLastPrimaryAsc,
  resolveCursorPageSize,
} from "./cursor-pagination";

describe("cursor-pagination", () => {
  it("encode/decode round-trip", () => {
    const payload = { v: 1, at: 100, id: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee", fp: "u1" };
    const token = encodePageToken(payload);
    const decoded = decodePageToken(token, (o) => ({
      v: o.v as number,
      at: o.at as number,
      id: o.id as string,
      fp: o.fp as string,
    }));
    assert.deepEqual(decoded, payload);
  });

  it("resolveCursorPageSize clamps to max", () => {
    assert.equal(resolveCursorPageSize(undefined), 20);
    assert.equal(resolveCursorPageSize(100), 50);
    assert.equal(resolveCursorPageSize(0), 1);
  });

  it("keysetAfterLastCreatedAtDesc shapes descending cursor filter", () => {
    const ks = keysetAfterLastCreatedAtDesc("orderId", 123, "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
    assert.equal(ks.$or.length, 2);
    assert.deepEqual(ks.$or[1], {
      createdAt: 123,
      orderId: { $lt: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee" },
    });
  });

  it("keysetAfterLastPrimaryAsc shapes ascending cursor filter", () => {
    const ks = keysetAfterLastPrimaryAsc("name", "Pizza", "menuItemId", "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
    assert.deepEqual(ks.$or[1], {
      name: "Pizza",
      menuItemId: { $gt: "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee" },
    });
  });
});
