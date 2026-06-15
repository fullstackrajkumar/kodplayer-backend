import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSchema } from "../schema.helper";
import { uuidField } from "../uuid-fields";
import { transformUuidQueryFilter } from "./uuid-query.plugin";

const TestSchema = createSchema({
  orderId: uuidField({ unique: true }),
});

function keysetFilter(orderId: string): Record<string, unknown> {
  return {
    $and: [
      { userId: "00000000-0000-4000-8000-000000000001", deletedAt: null },
      {
        $or: [
          { createdAt: { $lt: 1_700_000_000_000 } },
          { createdAt: 1_700_000_000_000, orderId: { $lt: orderId } },
        ],
      },
    ],
  };
}

describe("uuid-query.plugin keyset pagination", () => {
  it("expands UUID $lt to BSON without nesting $or on the UUID path", () => {
    const filter = keysetFilter("aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee");
    transformUuidQueryFilter(TestSchema, filter);

    const branches = (filter.$and as Record<string, unknown>[])[1] as { $or: Record<string, unknown>[] };
    const tieBreak = branches.$or[1] as { orderId: Record<string, unknown> };

    assert.ok(tieBreak.orderId);
    assert.ok("$lt" in tieBreak.orderId, "expected single $lt on orderId");
    assert.equal("$or" in tieBreak.orderId, false, "must not nest $or under UUID path");
  });
});
