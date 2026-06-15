import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import {
  UserDbService,
  UserRefreshTokenDbService,
  type User,
} from "@mbt/api-common";
import { REFRESH_TOKEN_EXPIRES_IN } from "../../../constants/app.constant";
import { parseExpiryToMs } from "../utils/otp-crypto";

const REFRESH_TOKEN_BYTES = 32;

export interface UserJwtPayload {
  sub: string;
  type: "user";
  phone?: string;
}

export interface UserTokenPair {
  accessToken: string;
  refreshToken: string;
  /** Unix epoch milliseconds. */
  refreshTokenExpiresAt: number;
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class AuthTokensService {
  constructor(
    private readonly userDb: UserDbService,
    private readonly userRefreshTokenDb: UserRefreshTokenDbService,
    private readonly jwtService: JwtService,
  ) {}

  async issueTokenPair(
    userId: string,
    phone: string,
    meta?: { clientIp?: string; deviceToken?: string },
  ): Promise<UserTokenPair> {
    const accessToken = this.jwtService.sign({ sub: userId, type: "user", phone } as UserJwtPayload);
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const refreshMs = parseExpiryToMs(REFRESH_TOKEN_EXPIRES_IN);
    const refreshTokenExpiresAt = Date.now() + refreshMs;
    await this.userRefreshTokenDb.create({
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
      clientIp: meta?.clientIp ?? "",
      deviceToken: meta?.deviceToken ?? "",
    } as never);
    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }

  async refresh(
    refreshToken: string,
    meta?: { clientIp?: string; deviceToken?: string },
  ): Promise<{ user: User; accessToken: string; refreshToken: string; refreshTokenExpiresAt: number }> {
    if (!refreshToken?.trim()) {
      throw new UnauthorizedException("Refresh token required");
    }
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await this.userRefreshTokenDb.findByTokenHash(tokenHash);
    if (!stored) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    const userId = String((stored as { userId?: string }).userId ?? "");
    if (!userId) {
      await this.userRefreshTokenDb.deleteByTokenHash(tokenHash);
      throw new UnauthorizedException("Invalid refresh token");
    }
    const userDoc = await this.userDb.findByUserId(userId);
    if (!userDoc) {
      await this.userRefreshTokenDb.deleteByTokenHash(tokenHash);
      throw new UnauthorizedException("User not found");
    }
    await this.userRefreshTokenDb.deleteByTokenHash(tokenHash);
    const phone = String((userDoc as { phoneNumber?: string }).phoneNumber ?? "");
    const newPair = await this.issueTokenPair(userId, phone, meta);
    const u = userDoc as unknown as User;
    return { user: u, ...newPair };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = hashRefreshToken(refreshToken);
    await this.userRefreshTokenDb.deleteByTokenHash(tokenHash);
  }
}
