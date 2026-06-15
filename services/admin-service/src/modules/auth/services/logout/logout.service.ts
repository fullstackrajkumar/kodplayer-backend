import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { RefreshTokenDbService } from "@mbt/api-common";

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

@Injectable()
export class LogoutService {
  constructor(private readonly refreshTokenDb: RefreshTokenDbService) {}

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = hashRefreshToken(refreshToken);
    await this.refreshTokenDb.deleteByTokenHash(tokenHash);
  }
}
