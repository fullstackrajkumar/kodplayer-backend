import { createHash, randomInt } from "node:crypto";

const DEFAULT_PEPPER = "dev-otp-pepper-change-in-production";

export function otpPepper(): string {
  return process.env.OTP_PEPPER || DEFAULT_PEPPER;
}

export function hashOtp(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}|${code}|${otpPepper()}`).digest("hex");
}

export function generateOtpCode(digits = 6): string {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(randomInt(min, max));
}

export function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return n * (multipliers[unit] ?? 86400000);
}
