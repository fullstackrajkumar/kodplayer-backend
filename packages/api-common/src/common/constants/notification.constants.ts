/** Push notification categories (data payload `type`). */
export enum NotificationType {
  PROMOTION = "PROMOTION",
  CHAT = "CHAT",
}

export function isOrderNotificationType(type: string): boolean {
  return false;
}

export const DEVICE_PLATFORMS = ["android", "ios", "web"] as const;
export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];
