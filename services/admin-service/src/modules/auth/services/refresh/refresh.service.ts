import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import { AdminDbService, RefreshTokenDbService, type Admin } from "@mbt/api-common";
import { ACCESS_TOKEN_EXPIRES_IN } from "../../../../constants/app.constant";
import { JwtPayload, TokenPair } from "../login/login.service";

const REFRESH_TOKEN_BYTES = 32;

function parseExpiryToMs(expiry: string): number {
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

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class RefreshService {
  constructor(
    private readonly adminDb: AdminDbService,
    private readonly refreshTokenDb: RefreshTokenDbService,
    private readonly jwtService: JwtService,
  ) {}

  async refresh(refreshToken: string): Promise<{
    admin: Admin;
    accessToken: string;
    refreshToken: string;
    /** Unix epoch milliseconds. */
    refreshTokenExpiresAt: number;
  }> {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token required");
    }
    const tokenHash = hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenDb.findByTokenHash(tokenHash);
    if (!stored) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
    const raw = stored as unknown as { adminId?: string };
    const adminId = typeof raw.adminId === "string" ? raw.adminId : "";
    if (!adminId) {
      await this.refreshTokenDb.deleteByTokenHash(tokenHash);
      throw new UnauthorizedException("Invalid refresh token");
    }
    const admin = await this.adminDb.findByAdminId(adminId);
    if (!admin) {
      await this.refreshTokenDb.deleteByTokenHash(tokenHash);
      throw new UnauthorizedException("Admin not found");
    }
    const doc = admin as Admin & { isActive?: boolean };
    if (doc.isActive === false) {
      await this.refreshTokenDb.deleteByTokenHash(tokenHash);
      throw new UnauthorizedException("Account is deactivated");
    }
    await this.refreshTokenDb.deleteByTokenHash(tokenHash);
    const newPair = await this.issueTokenPair(adminId, doc.email);
    await this.storeRefreshToken(adminId, newPair.refreshToken, newPair.refreshTokenExpiresAt);
    const { password: _p, passwordResetToken: _t, passwordResetExpires: _e, ...profile } = doc;
    return {
      admin: profile as Admin,
      accessToken: newPair.accessToken,
      refreshToken: newPair.refreshToken,
      refreshTokenExpiresAt: newPair.refreshTokenExpiresAt,
    };
  }

  private async issueTokenPair(
    adminId: string,
    email: string,
  ): Promise<TokenPair> {
    const accessToken = this.jwtService.sign(
      { sub: adminId, email, type: "admin" } as JwtPayload,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
    );
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
    const refreshMs = parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d");
    const refreshTokenExpiresAt = Date.now() + refreshMs;
    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private async storeRefreshToken(
    adminId: string,
    refreshToken: string,
    expiresAt: number,
  ): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    await this.refreshTokenDb.create({
      adminId: adminId as never,
      tokenHash,
      expiresAt,
    } as never);
  }
}
