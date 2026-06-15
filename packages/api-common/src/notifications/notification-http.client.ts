/**
 * Lightweight HTTP client for other services (api-service, admin-service) to enqueue pushes.
 */
export interface SendNotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export async function sendNotificationViaHttp(
  baseUrl: string,
  apiKey: string,
  payload: SendNotificationPayload,
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/v1/notification/send`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-notification-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Notification service error ${res.status}: ${text}`);
  }
}
