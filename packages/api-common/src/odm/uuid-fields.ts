import { Schema, SchemaDefinitionProperty } from "mongoose";
import { newUuid } from "./uuid-default";

type UuidFieldOptions = {
  required?: boolean;
  unique?: boolean;
  index?: boolean | Record<string, unknown>;
  default?: (() => string) | false;
  select?: boolean;
};

/** Top-level business-key or FK field — persisted as BSON UUID. */
export function uuidField(options: UuidFieldOptions = {}): SchemaDefinitionProperty {
  const { required = true, unique, index, default: defaultFn = () => newUuid(), select } = options;
  return {
    type: Schema.Types.UUID,
    required,
    ...(unique !== undefined && { unique }),
    ...(index !== undefined && { index }),
    ...(defaultFn !== false && { default: defaultFn }),
    ...(select !== undefined && { select }),
  };
}

/** Top-level FK to another entity's business key (no auto-generated default). */
export function uuidRefField(
  options: Pick<UuidFieldOptions, "required" | "unique" | "index"> = {},
): SchemaDefinitionProperty {
  return uuidField({ ...options, default: false });
}

/** UUID inside an embedded subdocument — plain string for snapshot stability. */
export function nestedUuidField(options: { required?: boolean; default?: () => string } = {}): SchemaDefinitionProperty {
  const { required = true, default: defaultFn } = options;
  return {
    type: String,
    required,
    ...(defaultFn !== undefined && { default: defaultFn }),
  };
}
