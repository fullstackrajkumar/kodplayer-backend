/** Flat key-value metadata returned in the API envelope `data` field. */
export type AppMetadataData = Record<string, unknown>;

export const APP_METADATA_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: true,
  example: { appName: "Your App Name", currency: "USD" },
} as const;
