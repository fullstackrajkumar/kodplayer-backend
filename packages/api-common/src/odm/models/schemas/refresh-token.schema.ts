import { BaseTimestamps, createSchema } from "../../schema.helper";
import { uuidRefField } from "../../uuid-fields";
import { HydratedDocument, Model } from "mongoose";

export const REFRESH_TOKEN_MODEL_NAME = "RefreshToken";

export const RefreshTokenSchema = createSchema(
  {
    /** References `Admin.adminId`. */
    adminId: uuidRefField({ index: true }),
    tokenHash: { type: String, required: true },
    /** Unix epoch milliseconds. */
    expiresAt: { type: Number, required: true },
  },
  { timestamps: true },
);

RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });

export interface RefreshToken extends BaseTimestamps {
  adminId: string;
  tokenHash: string;
  /** Unix epoch milliseconds. */
  expiresAt: number;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

export interface RefreshTokenModel extends Model<RefreshTokenDocument> {}
