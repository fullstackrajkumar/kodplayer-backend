import { BaseTimestamps, createSchema } from "../../schema.helper";
import { HydratedDocument, Model, Schema as MSchema } from "mongoose";
import { uuidField, uuidRefField } from "../../uuid-fields";

export const NOTIFICATION_MODEL_NAME = "Notification";

export const NotificationSchema = createSchema(
  {
    notificationId: uuidField({ unique: true, index: true }),
    userId: uuidRefField({ index: true }),
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true, index: true },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: MSchema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true, collection: "notifications" },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export interface Notification extends BaseTimestamps {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
}

export type NotificationDocument = HydratedDocument<Notification>;
export interface NotificationModel extends Model<NotificationDocument> {}
