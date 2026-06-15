export const PORT = process.env.ADMIN_PORT || process.env.PORT || "8081";
export const API_BASE_PATH = "v1/admin";

export const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret-change-me";
export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export const COOKIE_ACCESS_TOKEN = "accessToken";
export const COOKIE_REFRESH_TOKEN = "refreshToken";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const REDIS_URL = process.env.REDIS_URL ?? "";

export const ADMIN_REALTIME_API_KEY =
  process.env.ADMIN_REALTIME_API_KEY || "dev-admin-realtime-api-key";
