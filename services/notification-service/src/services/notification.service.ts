import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  NotificationDbService,
  UserDbService,
  UserDeviceDbService,
  type RegisterUserDeviceInput,
} from "@mbt/api-common";
import { NOTIFICATION_QUEUE_NAME } from "../constants/app.constant";
import {
  NOTIFICATION_JOB_SEND,
  type NotificationJobPayload,
} from "../queues/notification.queue";

export interface SendNotificationInput {
  userId: string;
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationDb: NotificationDbService,
    private readonly userDeviceDb: UserDeviceDbService,
    private readonly userDb: UserDbService,
    @InjectQueue(NOTIFICATION_QUEUE_NAME) private readonly queue: Queue<NotificationJobPayload>,
  ) {}

  async registerDevice(input: RegisterUserDeviceInput) {
    const user = await this.userDb.findByUserId(input.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return this.userDeviceDb.registerDevice(input);
  }

  async unregisterDevice(fcmToken: string): Promise<void> {
    await this.userDeviceDb.removeByFcmToken(fcmToken);
  }

  async enqueueSend(input: SendNotificationInput) {
    const user = await this.userDb.findByUserId(input.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const prefs = (user as { notificationPreferences?: { pushEnabled?: boolean } })
      .notificationPreferences;
    if (prefs?.pushEnabled === false) {
      return { queued: false, reason: "push_disabled" as const };
    }

    const doc = await this.notificationDb.createNotification({
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      metadata: input.metadata,
    });

    await this.queue.add(
      NOTIFICATION_JOB_SEND,
      {
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type,
        metadata: input.metadata,
        notificationId: doc.notificationId,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    );

    return { queued: true, notificationId: doc.notificationId };
  }

  async listForUser(userId: string, skip?: number, limit?: number) {
    return this.notificationDb.listByUserId(userId, { skip, limit });
  }

  async markRead(notificationId: string, userId: string) {
    const updated = await this.notificationDb.markRead(notificationId, userId);
    if (!updated) {
      throw new NotFoundException("Notification not found");
    }
    return updated;
  }
}
