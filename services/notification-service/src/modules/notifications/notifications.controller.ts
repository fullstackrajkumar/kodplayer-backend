import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { ApiSuccessResponseMessage, API_RESPONSE_400, API_RESPONSE_500 } from "@mbt/api-common";
import { InternalApiKeyGuard } from "../../guards/internal-api-key.guard";
import { NotificationService } from "../../services/notification.service";
import {
  ListNotificationsQueryDto,
  RegisterDeviceDto,
  SendNotificationDto,
  UnregisterDeviceDto,
} from "./dto/notification.dto";

@ApiTags("Notifications")
@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationService) {}

  @Post("register-device")
  @ApiOperation({
    summary: "Register or refresh an FCM token for a user (supports multiple devices per account)",
  })
  @ApiSuccessResponseMessage("Device registered")
  @ApiResponse(API_RESPONSE_400)
  @ApiResponse(API_RESPONSE_500)
  async registerDevice(@Body() dto: RegisterDeviceDto) {
    const device = await this.notifications.registerDevice({
      userId: dto.userId.trim(),
      fcmToken: dto.fcmToken.trim(),
      platform: dto.platform,
      deviceId: dto.deviceId,
      appVersion: dto.appVersion,
    });
    return { device };
  }

  @Post("unregister-device")
  @ApiOperation({ summary: "Remove an FCM token (logout / uninstall)" })
  @ApiSuccessResponseMessage("Device unregistered")
  async unregisterDevice(@Body() dto: UnregisterDeviceDto) {
    await this.notifications.unregisterDevice(dto.fcmToken.trim());
    return { ok: true };
  }

  @Post("send")
  @UseGuards(InternalApiKeyGuard)
  @ApiSecurity("notificationApiKey")
  @ApiOperation({
    summary: "Enqueue push to all devices for user (internal — requires x-notification-api-key)",
  })
  @ApiSuccessResponseMessage("Notification queued")
  async send(@Body() dto: SendNotificationDto) {
    return this.notifications.enqueueSend({
      userId: dto.userId.trim(),
      title: dto.title.trim(),
      body: dto.body.trim(),
      type: dto.type,
      metadata: dto.metadata,
    });
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Notification center history for a user" })
  @ApiSuccessResponseMessage("Notifications listed")
  async listForUser(
    @Param("userId") userId: string,
    @Query() query: ListNotificationsQueryDto,
  ) {
    const skip = Number(query.skip) || 0;
    const limit = Number(query.limit) || 50;
    return this.notifications.listForUser(userId.trim(), skip, limit);
  }

  @Patch("read/:notificationId")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiSuccessResponseMessage("Notification marked read")
  async markRead(
    @Param("notificationId") notificationId: string,
    @Query("userId") userId: string,
  ) {
    const updated = await this.notifications.markRead(notificationId.trim(), userId.trim());
    return { notification: updated };
  }
}
