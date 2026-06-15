import { Injectable } from "@nestjs/common";
import { AdminDbService } from "@mbt/api-common";
import { randomBytes } from "node:crypto";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

@Injectable()
export class ForgotPasswordService {
  constructor(private readonly adminDb: AdminDbService) {}

  async forgotPassword(email: string): Promise<{
    message: string;
    resetToken?: string;
    /** Unix epoch milliseconds. */
    resetTokenExpiresAt?: number;
  }> {
    const admin = await this.adminDb.findByEmail(email, { includePassword: true });
    if (!admin) {
      return {
        message: "If an account exists for this email, you will receive a reset link.",
      };
    }
    const resetToken = randomBytes(RESET_TOKEN_BYTES).toString("hex");
    const resetTokenExpires = Date.now() + RESET_TOKEN_EXPIRY_MS;
    await this.adminDb.updateOne(
      { email: email.toLowerCase() } as never,
      {
        $set: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetTokenExpires,
        },
      } as never,
    );
    const isDev = process.env.NODE_ENV !== "production";
    return {
      message: "If an account exists for this email, you will receive a reset link.",
      ...(isDev && {
        resetToken,
        resetTokenExpiresAt: resetTokenExpires,
      }),
    };
  }
}
