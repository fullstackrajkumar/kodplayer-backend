import { Query, Schema, SchemaType } from "mongoose";

const QUERY_HOOKS = [
  "find",
  "findOne",
  "findOneAndUpdate",
  "findOneAndDelete",
  "updateOne",
  "updateMany",
  "deleteOne",
  "deleteMany",
  "countDocuments",
  "estimatedDocumentCount",
  "exists",
] as const;

function topLevelUuidPaths(schema: Schema): Set<string> {
  const paths = new Set<string>();
  schema.eachPath((pathname, pathType) => {
    if (pathType.instance === "UUID" && !pathname.includes(".")) {
      paths.add(pathname);
    }
  });
  return paths;
}

function castUuid(schemaPath: SchemaType, value: string): unknown {
  return schemaPath.cast(value);
}

/** Match legacy string UUIDs and BSON UUID (Buffer) values in MongoDB. */
export function expandUuidMatchValue(schemaPath: SchemaType | undefined, value: string): unknown {
  if (!schemaPath || schemaPath.instance !== "UUID") {
    return value;
  }
  try {
    return { $in: [value, castUuid(schemaPath, value)] };
  } catch {
    return value;
  }
}

/** Mongoose UUID `castForQuery` rejects `$or` on the field (see schema/uuid.js). */
function assertUuidExpansionMongooseSafe(expanded: unknown): void {
  if (
    expanded &&
    typeof expanded === "object" &&
    !Array.isArray(expanded) &&
    "$or" in (expanded as Record<string, unknown>)
  ) {
    throw new Error(
      "UUID query expansion must not use `$or` on a UUID path (Mongoose throws \"Can't use $or with UUID.\"). " +
        "Use a single $gt/$gte/$lt/$lte with a BSON-cast value.",
    );
  }
}

function expandUuidOperator(
  schemaPath: SchemaType,
  op: "$eq" | "$ne" | "$gt" | "$gte" | "$lt" | "$lte",
  value: string,
): Record<string, unknown> {
  try {
    const casted = castUuid(schemaPath, value);
    if (op === "$ne") {
      return { $nin: [value, casted] };
    }
    // Mongoose UUID paths only allow $gt/$gte/$lt/$lte on a single cast value — not `{ $or: [...] }`
    // (throws "Can't use $or with UUID."). BSON UUID matches Schema.Types.UUID storage.
    const expanded = { [op]: casted };
    assertUuidExpansionMongooseSafe(expanded);
    return expanded;
  } catch (err) {
    if (err instanceof Error && err.message.includes("UUID query expansion")) {
      throw err;
    }
    return { [op]: value };
  }
}

function expandUuidIn(schemaPath: SchemaType, values: unknown[]): { $in: unknown[] } {
  const expanded: unknown[] = [];
  const seen = new Set<string>();

  const push = (v: unknown, tag: string) => {
    if (seen.has(tag)) return;
    seen.add(tag);
    expanded.push(v);
  };

  for (const item of values) {
    if (typeof item !== "string") {
      push(item, String(item));
      continue;
    }
    push(item, item);
    try {
      const casted = castUuid(schemaPath, item);
      const tag = Buffer.isBuffer(casted) ? `b:${casted.toString("hex")}` : String(casted);
      push(casted, tag);
    } catch {
      // keep string-only entry
    }
  }

  return { $in: expanded };
}

function expandUuidClause(schemaPath: SchemaType | undefined, value: unknown): unknown {
  if (!schemaPath || schemaPath.instance !== "UUID") {
    return value;
  }
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return expandUuidMatchValue(schemaPath, value);
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const obj = value as Record<string, unknown>;

  if (Array.isArray(obj.$in)) {
    return expandUuidIn(schemaPath, obj.$in);
  }

  for (const op of ["$eq", "$ne", "$gt", "$gte", "$lt", "$lte"] as const) {
    if (typeof obj[op] === "string") {
      const expanded = expandUuidOperator(schemaPath, op, obj[op]);
      assertUuidExpansionMongooseSafe(expanded);
      return expanded;
    }
  }

  return value;
}

/**
 * Rewrites top-level UUID field predicates so queries match both string and BSON UUID storage.
 */
export function transformUuidQueryFilter(schema: Schema, filter: Record<string, unknown>): void {
  if (!filter || typeof filter !== "object") {
    return;
  }

  const uuidPaths = topLevelUuidPaths(schema);

  const walk = (node: Record<string, unknown>): void => {
    for (const key of Object.keys(node)) {
      if (key === "$and" || key === "$or") {
        const branches = node[key];
        if (Array.isArray(branches)) {
          for (const branch of branches) {
            if (branch && typeof branch === "object" && !Array.isArray(branch)) {
              walk(branch as Record<string, unknown>);
            }
          }
        }
        continue;
      }

      if (uuidPaths.has(key)) {
        node[key] = expandUuidClause(schema.path(key), node[key]);
      }
    }
  };

  walk(filter);
}

function applyUuidQueryTransform(this: Query<unknown, unknown>): void {
  const filter = this.getFilter() as Record<string, unknown>;
  if (!filter || typeof filter !== "object") {
    return;
  }
  transformUuidQueryFilter(this.model.schema, filter);
  this.setQuery(filter);
}

/** Ensures string UUID query params match BSON UUID and legacy string values in MongoDB. */
export function uuidQueryPlugin(schema: Schema): void {
  schema.pre(QUERY_HOOKS as unknown as RegExp, applyUuidQueryTransform);
}
