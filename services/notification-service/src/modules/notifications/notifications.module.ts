import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { NOTIFICATION_QUEUE_NAME, REDIS_URL } from "../../constants/app.constant";
import { NotificationProcessor } from "../../processors/notification.processor";
import { FirebaseService } from "../../services/firebase.service";
import { NotificationService } from "../../services/notification.service";
import { InternalApiKeyGuard } from "../../guards/internal-api-key.guard";
import { NotificationsController } from "./notifications.controller";

@Module({
  imports: [
    BullModule.forRoot({
      connection: { url: REDIS_URL },
    }),
    BullModule.registerQueue({ name: NOTIFICATION_QUEUE_NAME }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationService, FirebaseService, NotificationProcessor, InternalApiKeyGuard],
  exports: [NotificationService],
})
export class NotificationsModule {}
