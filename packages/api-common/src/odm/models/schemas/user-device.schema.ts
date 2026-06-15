import { BaseTimestamps, createSchema } from "../../schema.helper";
import { uuidRefField } from "../../uuid-fields";
import { HydratedDocument, Model } from "mongoose";

export const USER_DEVICE_MODEL_NAME = "UserDevice";

export const UserDeviceSchema = createSchema(
  {
    /** References `User.userId`. */
    userId: uuidRefField({ index: true }),
    /** Firebase Cloud Messaging registration token. */
    fcmToken: { type: String, required: true, trim: true },
    platform: { type: String, default: "android", trim: true },
    /** Optional stable device id from the client. */
    deviceId: { type: String, default: "", trim: true },
    appVersion: { type: String, default: "", trim: true },
    /** Unix epoch milliseconds — last time this token was confirmed active. */
    lastSeenAt: { type: Number, default: () => Date.now() },
  },
  { timestamps: true, collection: "user_devices" },
);

UserDeviceSchema.index({ fcmToken: 1 }, { unique: true });
UserDeviceSchema.index({ userId: 1, deviceId: 1 });

export interface UserDevice extends BaseTimestamps {
  userId: string;
  fcmToken: string;
  platform: string;
  deviceId: string;
  appVersion: string;
  lastSeenAt: number;
}

export type UserDeviceDocument = HydratedDocument<UserDevice>;
export interface UserDeviceModel extends Model<UserDeviceDocument> {}
