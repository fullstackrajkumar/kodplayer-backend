import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseDbService } from "../../db-service.base";
import {
  NOTIFICATION_MODEL_NAME,
  Notification,
  NotificationDocument,
} from "../../models/schemas/notification.schema";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationDbService extends BaseDbService<NotificationDocument> {
  constructor(@InjectModel(NOTIFICATION_MODEL_NAME) model: Model<NotificationDocument>) {
    super(model);
  }

  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    return this.create({
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      metadata: input.metadata ?? {},
      isRead: false,
    } as never);
  }

  async listByUserId(
    userId: string,
    options: { skip?: number; limit?: number } = {},
  ): Promise<{ items: Notification[]; totalCount: number }> {
    const skip = options.skip ?? 0;
    const limit = Math.min(options.limit ?? 50, 100);
    const filter = { userId, deletedAt: null };
    const [totalCount, items] = await Promise.all([
      this.count(filter as never),
      this.find(filter as never, { skip, limit, sort: { createdAt: -1 } }),
    ]);
    return { items: items as Notification[], totalCount };
  }

  async markRead(notificationId: string, userId: string): Promise<Notification | null> {
    return this.updateOne(
      { notificationId, userId, deletedAt: null } as never,
      { $set: { isRead: true } } as never,
    );
  }
}
