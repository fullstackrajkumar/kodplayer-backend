import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { UserDeviceDbService } from "@mbt/api-common";
import { NOTIFICATION_QUEUE_NAME } from "../constants/app.constant";
import { NOTIFICATION_JOB_SEND, type NotificationJobPayload } from "../queues/notification.queue";
import { FirebaseService } from "../services/firebase.service";

@Processor(NOTIFICATION_QUEUE_NAME)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly firebase: FirebaseService,
    private readonly userDeviceDb: UserDeviceDbService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobPayload>): Promise<void> {
    if (job.name !== NOTIFICATION_JOB_SEND) return;
    const { userId, title, body, type, metadata, notificationId } = job.data;
    const tokens = await this.userDeviceDb.findFcmTokensByUserId(userId);
    if (tokens.length === 0) {
      this.logger.log(`No FCM tokens for user ${userId}; notification ${notificationId} stored only`);
      return;
    }

    const data: Record<string, string> = {
      type,
      notificationId,
      ...(metadata
        ? Object.fromEntries(
            Object.entries(metadata).map(([k, v]) => [k, v == null ? "" : String(v)]),
          )
        : {}),
    };

    const result = await this.firebase.sendMulticast({ tokens, title, body, data });
    for (const invalid of result.invalidTokens) {
      await this.userDeviceDb.removeByFcmToken(invalid);
    }
    this.logger.log(
      `FCM user=${userId} success=${result.successCount} failure=${result.failureCount}`,
    );
  }
}
