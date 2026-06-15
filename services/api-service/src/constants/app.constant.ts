export const PORT: string = process.env.PORT || "8080";
export const API_BASE_PATH = "v1";

export const JWT_SECRET =
  process.env.APP_JWT_SECRET || process.env.JWT_SECRET || "default-app-jwt-secret-change-me";
export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

/** Public app cookies (distinct names from admin `accessToken` / `refreshToken` when sharing a host). */
export const COOKIE_APP_ACCESS_TOKEN = "appAccessToken";
export const COOKIE_APP_REFRESH_TOKEN = "appRefreshToken";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Minimum delay between OTP sends for the same phone (ms). */
export const OTP_SEND_COOLDOWN_MS = Number(process.env.OTP_SEND_COOLDOWN_MS) || 60_000;
/** Max OTP sends per phone within `OTP_RATE_WINDOW_MS`. */
export const OTP_SEND_MAX_PER_WINDOW = Number(process.env.OTP_SEND_MAX_PER_WINDOW) || 5;
export const OTP_RATE_WINDOW_MS = Number(process.env.OTP_RATE_WINDOW_MS) || 15 * 60 * 1000;
/** OTP validity (ms). */
export const OTP_TTL_MS = Number(process.env.OTP_TTL_MS) || 10 * 60 * 1000;
/** Max wrong verify attempts per phone within `OTP_RATE_WINDOW_MS` before lockout. */
export const OTP_VERIFY_FAIL_MAX = Number(process.env.OTP_VERIFY_FAIL_MAX) || 5;
/** Max concurrent in-flight send-otp / verify-otp operations (abuse guard). */
export const OTP_MAX_CONCURRENT = Number(process.env.OTP_MAX_CONCURRENT) || 5;
