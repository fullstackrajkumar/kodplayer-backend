import { BaseTimestamps, createSchema } from "../../schema.helper";
import { uuidRefField } from "../../uuid-fields";
import { HydratedDocument, Model } from "mongoose";

export const USER_REFRESH_TOKEN_MODEL_NAME = "UserRefreshToken";

export const UserRefreshTokenSchema = createSchema(
  {
    /** References `User.userId`. */
    userId: uuidRefField({ index: true }),
    tokenHash: { type: String, required: true },
    /** Unix epoch milliseconds. */
    expiresAt: { type: Number, required: true },
    clientIp: { type: String, default: "" },
    deviceToken: { type: String, default: "" },
  },
  { timestamps: true, collection: "user_refresh_tokens" },
);

UserRefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });

export interface UserRefreshToken extends BaseTimestamps {
  userId: string;
  tokenHash: string;
  /** Unix epoch milliseconds. */
  expiresAt: number;
  clientIp: string;
  deviceToken: string;
}

export type UserRefreshTokenDocument = HydratedDocument<UserRefreshToken>;
export interface UserRefreshTokenModel extends Model<UserRefreshTokenDocument> {}
