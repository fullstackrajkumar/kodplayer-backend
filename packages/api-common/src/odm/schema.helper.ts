import { Schema, SchemaDefinition, SchemaOptions } from "mongoose";
import { uuidQueryPlugin } from "./plugins/uuid-query.plugin";

/**
 * Common timestamp + soft-delete fields auto-injected by `createSchema`.
 * Every collection's interface should `extends BaseTimestamps`.
 */
export interface BaseTimestamps {
  /** Unix epoch milliseconds. */
  createdAt?: number;
  /** Unix epoch milliseconds. */
  updatedAt?: number;
  /** Unix epoch milliseconds when soft-deleted, else `null`. */
  deletedAt: number | null;
  /** userId/adminId of the actor who soft-deleted, else `null`. */
  deletedBy: string | null;
}

const jsonTransform = (_doc: unknown, ret: Record<string, unknown>): Record<string, unknown> => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

/**
 * Every collection gets:
 *  - numeric `createdAt` / `updatedAt` (Unix ms) via `timestamps.currentTime`
 *  - soft-delete fields `deletedAt` (Unix ms or `null`) and `deletedBy` (userId/adminId or `null`)
 *
 * Declaring `createdAt`/`updatedAt` as `Number` and pairing with `currentTime: () => Date.now()`
 * makes Mongoose persist and read them as numeric milliseconds rather than `Date`.
 */
const SOFT_DELETE_AND_TIMESTAMP_FIELDS: SchemaDefinition = {
  createdAt: { type: Number },
  updatedAt: { type: Number },
  deletedAt: { type: Number, default: null },
  deletedBy: { type: Schema.Types.UUID, required: false, default: null },
};

const DEFAULT_SCHEMA_OPTIONS: SchemaOptions = {
  timestamps: { currentTime: () => Date.now() },
  toJSON: {
    virtuals: true,
    transform: jsonTransform,
  },
  toObject: {
    virtuals: true,
    transform: jsonTransform,
  },
};

export function createSchema(definition: SchemaDefinition, options: SchemaOptions = {}): Schema {
  const enriched: SchemaDefinition = {
    ...SOFT_DELETE_AND_TIMESTAMP_FIELDS,
    ...definition,
  };
  const { timestamps, ...restOptions } = options;
  const schema = new Schema(enriched, {
    ...DEFAULT_SCHEMA_OPTIONS,
    ...restOptions,
    timestamps:
      timestamps === false
        ? false
        : { currentTime: () => Date.now(), ...(typeof timestamps === "object" ? timestamps : {}) },
  });
  schema.plugin(uuidQueryPlugin);
  return schema;
}
