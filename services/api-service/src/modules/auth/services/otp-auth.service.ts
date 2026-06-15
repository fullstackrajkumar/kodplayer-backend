import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { UserDbService, PhoneOtpChallengeDbService, type User } from "@mbt/api-common";
import {
  OTP_MAX_CONCURRENT,
  OTP_RATE_WINDOW_MS,
  OTP_SEND_COOLDOWN_MS,
  OTP_SEND_MAX_PER_WINDOW,
  OTP_TTL_MS,
  OTP_VERIFY_FAIL_MAX,
} from "../../../constants/app.constant";
import { generateOtpCode, hashOtp } from "../utils/otp-crypto";

export function clientIpFromRequest(req: {
  ip?: string;
  headers?: Record<string, unknown>;
}): string {
  const xf = req.headers?.["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) {
    return xf.split(",")[0]?.trim() || "";
  }
  if (Array.isArray(xf) && xf[0]) return String(xf[0]).split(",")[0]?.trim() || "";
  return typeof req.ip === "string" ? req.ip : "";
}

let sendConcurrent = 0;
let verifyConcurrent = 0;

export interface SendOtpResult {
  challengeId: string;
  /** Unix epoch milliseconds. */
  expiresAt: number;
  resendAvailableInSec: number;
}

@Injectable()
export class OtpAuthService {
  private readonly logger = new Logger(OtpAuthService.name);

  constructor(
    private readonly phoneOtpDb: PhoneOtpChallengeDbService,
    private readonly userDb: UserDbService,
  ) {}

  async sendOtp(
    dto: { phone: string; deviceToken?: string },
    req: { ip?: string; headers?: Record<string, unknown> },
  ): Promise<SendOtpResult> {
    if (sendConcurrent >= OTP_MAX_CONCURRENT) {
      throw new HttpException(
        "Too many OTP requests in progress; try again shortly",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    sendConcurrent += 1;
    try {
      const phone = dto.phone.trim();
      const nowMs = Date.now();
      const existing = await this.phoneOtpDb.findOne({ phone } as never);

      if (existing?.lastSentAt) {
        const elapsed = nowMs - existing.lastSentAt;
        if (elapsed < OTP_SEND_COOLDOWN_MS) {
          const retryAfterSec = Math.ceil((OTP_SEND_COOLDOWN_MS - elapsed) / 1000);
          throw new HttpException(
            { message: `Please wait ${retryAfterSec}s before requesting another code`, retryAfterSec },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      let sendWindowStartedAt = existing?.sendWindowStartedAt ?? nowMs;
      let sendsInWindow = existing?.sendsInWindow ?? 0;
      if (existing && nowMs - sendWindowStartedAt > OTP_RATE_WINDOW_MS) {
        sendWindowStartedAt = nowMs;
        sendsInWindow = 0;
      }
      if (sendsInWindow >= OTP_SEND_MAX_PER_WINDOW) {
        throw new HttpException(
          "Maximum OTP sends reached for this number; try again later",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const challengeId = randomUUID();
      // const code = generateOtpCode(6);
      const code = "000000";
      const codeHash = hashOtp(phone, code);
      const expiresAt = nowMs + OTP_TTL_MS;
      const ip = clientIpFromRequest(req);
      const deviceToken = dto.deviceToken?.trim() ?? "";

      let verifyFailWindowStartedAt = existing?.verifyFailWindowStartedAt ?? nowMs;
      let verifyFailCount = existing?.verifyFailCount ?? 0;
      if (existing && nowMs - verifyFailWindowStartedAt > OTP_RATE_WINDOW_MS) {
        verifyFailWindowStartedAt = nowMs;
        verifyFailCount = 0;
      }

      await this.phoneOtpDb.upsertByPhone(phone, {
        challengeId,
        codeHash,
        expiresAt,
        lastSentAt: nowMs,
        sendWindowStartedAt,
        sendsInWindow: sendsInWindow + 1,
        verifyFailWindowStartedAt,
        verifyFailCount,
        lastClientIp: ip,
        lastDeviceToken: deviceToken,
      });

      if (process.env.NODE_ENV !== "production" || process.env.OTP_LOG_CODE === "1") {
        this.logger.log(`OTP for ${phone}: ${code} (challengeId=${challengeId}) — dev / OTP_LOG_CODE only`);
      }

      return {
        challengeId,
        expiresAt,
        resendAvailableInSec: Math.ceil(OTP_SEND_COOLDOWN_MS / 1000),
      };
    } finally {
      sendConcurrent -= 1;
    }
  }

  async verifyOtp(dto: {
    challengeId: string;
    code: string;
    deviceToken?: string;
  }): Promise<{ user: User; isNewUser: boolean; phone: string }> {
    if (verifyConcurrent >= OTP_MAX_CONCURRENT) {
      throw new HttpException(
        "Too many verify requests in progress; try again shortly",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    verifyConcurrent += 1;
    try {
      const challengeId = dto.challengeId.trim();
      const nowMs = Date.now();
      const doc = await this.phoneOtpDb.findByChallengeId(challengeId);
      if (!doc) {
        throw new UnauthorizedException("Invalid or expired challenge; request a new OTP");
      }
      const phone = doc.phone;

      let verifyFailWindowStartedAt = doc.verifyFailWindowStartedAt;
      let verifyFailCount = doc.verifyFailCount ?? 0;
      if (nowMs - verifyFailWindowStartedAt > OTP_RATE_WINDOW_MS) {
        verifyFailWindowStartedAt = nowMs;
        verifyFailCount = 0;
      }
      if (verifyFailCount >= OTP_VERIFY_FAIL_MAX) {
        throw new HttpException(
          "Too many failed attempts; request a new OTP",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (doc.expiresAt < nowMs) {
        throw new UnauthorizedException("Code expired; request a new OTP");
      }
      const expectedHash = doc.codeHash;
      const actualHash = hashOtp(phone, dto.code.trim());
      if (actualHash !== expectedHash) {
        await this.phoneOtpDb.updateOne(
          { challengeId } as never,
          {
            $set: {
              verifyFailWindowStartedAt,
              verifyFailCount: verifyFailCount + 1,
            },
          } as never,
        );
        throw new UnauthorizedException("Invalid code");
      }

      await this.phoneOtpDb.deleteByChallengeId(challengeId);

      let user = (await this.userDb.findByPhoneNumber(phone)) as unknown as User | null;
      let isNewUser = false;
      if (!user) {
        isNewUser = true;
        user = (await this.userDb.create({
          fullName: "user",
          email: null,
          phoneNumber: phone,
          profilePictureUrl: "",
        } as never)) as unknown as User;
      }

      return { user, isNewUser, phone };
    } finally {
      verifyConcurrent -= 1;
    }
  }
}
