import { HydratedDocument, Model, Schema as MSchema } from "mongoose";
import { BaseTimestamps, createSchema } from "../../schema.helper";
import { uuidField } from "../../uuid-fields";

export const USER_MODEL_NAME = "User";

const notificationPreferencesSchema = new MSchema(
  {
    pushEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
  },
  { _id: false },
);

export const UserSchema = createSchema(
  {
    userId: uuidField({ unique: true, index: true }),
    fullName: { type: String, required: true, trim: true },
    /** Sparse unique: OTP-only users may omit email. */
    email: { type: String, default: null, trim: true, lowercase: true },
    phoneNumber: { type: String, default: "", trim: true },
    profilePictureUrl: { type: String, default: "", trim: true },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true, collection: "users" },
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { phoneNumber: { $type: "string", $gt: "" } },
  },
);

export interface User extends BaseTimestamps {
  userId: string;
  fullName: string;
  email: string | null;
  phoneNumber: string;
  profilePictureUrl: string;
  notificationPreferences: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    promotions: boolean;
  };
}

export type UserDocument = HydratedDocument<User>;
export interface UserModel extends Model<UserDocument> {}
