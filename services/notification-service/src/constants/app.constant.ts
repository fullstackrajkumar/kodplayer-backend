export const PORT = process.env.NOTIFICATION_PORT || process.env.PORT || "8082";
export const API_BASE_PATH = "v1/notification";

export const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
export const NOTIFICATION_QUEUE_NAME = "push-notifications";

export const NOTIFICATION_SERVICE_API_KEY =
  process.env.NOTIFICATION_SERVICE_API_KEY || "dev-notification-api-key";

export const FIREBASE_SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "";
