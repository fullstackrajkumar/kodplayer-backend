import { Controller, Headers, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { API_RESPONSE_500 } from "@mbt/api-common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { PaymentWebhookService } from "./services/payment-webhook.service";

@ApiTags("Webhooks")
@Controller()
export class WebhooksController {
  constructor(private readonly paymentWebhookService: PaymentWebhookService) {}

  @Post("razorpay")
  @ApiOperation({
    summary: "Razorpay payment webhook",
    description:
      "Verifies signature and creates the order on success, or marks payment failed. Configure this URL in Razorpay dashboard.",
  })
  @ApiResponse({ status: 200, description: "Webhook processed" })
  @ApiResponse(API_RESPONSE_500)
  razorpay(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-razorpay-signature") signature: string,
  ): Promise<{ received: boolean; orderId?: string }> {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    return this.paymentWebhookService.handleRazorpay(rawBody, signature ?? "");
  }
}
