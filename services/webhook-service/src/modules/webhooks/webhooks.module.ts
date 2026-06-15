import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { PaymentWebhookService } from "./services/payment-webhook.service";

@Module({
  controllers: [WebhooksController],
  providers: [PaymentWebhookService],
})
export class WebhooksModule {}
