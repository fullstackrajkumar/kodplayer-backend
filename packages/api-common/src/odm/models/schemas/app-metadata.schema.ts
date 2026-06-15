import { HydratedDocument, Model, Schema as MSchema } from "mongoose";
import { BaseTimestamps, createSchema } from "../../schema.helper";

export const APP_METADATA_MODEL_NAME = "AppMetadata";

/** Default singleton document id for the main app config row. */
export const APP_METADATA_SINGLETON_ID = "app";

export const AppMetadataSchema = createSchema(
  {
    metadataId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    /** Arbitrary key-value config; shape is not fixed at the schema level. */
    data: {
      type: MSchema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true, collection: "app_metadata" },
);

export interface AppMetadata extends BaseTimestamps {
  metadataId: string;
  data: Record<string, unknown>;
}

export type AppMetadataDocument = HydratedDocument<AppMetadata>;
export interface AppMetadataModel extends Model<AppMetadataDocument> {}

export function emptyAppMetadata(
  metadataId: string = APP_METADATA_SINGLETON_ID,
): Pick<AppMetadata, "metadataId" | "data"> {
  return { metadataId, data: {} };
}
