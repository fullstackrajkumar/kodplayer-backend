import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import { AdminDbService, RefreshTokenDbService, type Admin } from "@mbt/api-common";
import { ACCESS_TOKEN_EXPIRES_IN } from "../../../../constants/app.constant";

const SALT_ROUNDS = 10;
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

export interface JwtPayload {
  sub: string;
  email: string;
  type: "admin";
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Unix epoch milliseconds. */
  refreshTokenExpiresAt: number;
}

@Injectable()
export class LoginService {
  constructor(
    private readonly adminDb: AdminDbService,
    private readonly refreshTokenDb: RefreshTokenDbService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{
    admin: Admin;
    accessToken: string;
    refreshToken: string;
    /** Unix epoch milliseconds. */
    refreshTokenExpiresAt: number;
  }> {
    const admin = await this.adminDb.findByEmail(email, { includePassword: true });
    if (!admin) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const doc = admin as Admin & { isActive?: boolean; password?: string };
    if (doc.isActive === false) {
      throw new UnauthorizedException("Account is deactivated");
    }
    const passwordMatch = await bcrypt.compare(password, doc.password ?? "");
    if (!passwordMatch) {
      throw new UnauthorizedException("Invalid email or password");
    }
    await this.adminDb.updateOne(
      { email: email.toLowerCase() } as never,
      { $set: { lastLoginAt: Date.now() } } as never,
    );
    const raw = admin as unknown as { adminId?: string; id?: string; _id?: { toString(): string } };
    const adminId = raw.adminId ?? raw.id ?? raw._id?.toString();
    if (!adminId) {
      throw new UnauthorizedException("Invalid admin record");
    }
    const { accessToken, refreshToken, refreshTokenExpiresAt } =
      await this.issueTokenPair(adminId, doc.email);
    await this.storeRefreshToken(adminId, refreshToken, refreshTokenExpiresAt);
    const { password: _p, passwordResetToken: _t, passwordResetExpires: _e, ...profile } = doc;
    return {
      admin: profile as Admin,
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
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

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }
}
