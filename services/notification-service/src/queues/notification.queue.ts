export const NOTIFICATION_JOB_SEND = "send-push";

export interface NotificationJobPayload {
  userId: string;
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, unknown>;
  notificationId: string;
}
