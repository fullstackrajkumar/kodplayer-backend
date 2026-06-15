import { BadRequestException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AdminDbService } from "@mbt/api-common";

const SALT_ROUNDS = 10;

@Injectable()
export class ResetPasswordService {
  constructor(private readonly adminDb: AdminDbService) {}

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const admin = await this.adminDb.findByResetToken(token);
    if (!admin) {
      throw new BadRequestException("Invalid or expired reset token");
    }
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.adminDb.updateOne(
      { passwordResetToken: token } as never,
      {
        $set: { password: hashed },
        $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
      } as never,
    );
  }
}
