import { Injectable, Logger } from "@nestjs/common";
import { DEVICE_PLATFORMS, UserDeviceDbService, type DevicePlatform } from "@mbt/api-common";

@Injectable()
export class UserDeviceRegistrationService {
  private readonly logger = new Logger(UserDeviceRegistrationService.name);

  constructor(private readonly userDeviceDb: UserDeviceDbService) {}

  /**
   * Persists FCM token for multi-device push. Called after successful verify-otp / refresh when client sends `deviceToken`.
   */
  async registerFromAuth(
    userId: string,
    deviceToken: string,
    options?: { platform?: string; deviceId?: string; appVersion?: string },
  ): Promise<void> {
    const fcmToken = deviceToken.trim();
    if (!fcmToken) return;
    try {
      await this.userDeviceDb.registerDevice({
        userId,
        fcmToken,
        platform: this.normalizePlatform(options?.platform),
        deviceId: options?.deviceId,
        appVersion: options?.appVersion,
      });
    } catch (err) {
      this.logger.warn(`Failed to register device for user ${userId}: ${String(err)}`);
    }
  }

  private normalizePlatform(platform?: string): DevicePlatform | undefined {
    const value = platform?.trim().toLowerCase();
    if (!value) return undefined;
    return (DEVICE_PLATFORMS as readonly string[]).includes(value)
      ? (value as DevicePlatform)
      : undefined;
  }
}
