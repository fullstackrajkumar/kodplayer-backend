import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { BaseDbService } from "../../db-service.base";
import { ADMIN_MODEL_NAME, AdminDocument } from "../../models/schemas/admin.schema";

@Injectable()
export class AdminDbService extends BaseDbService<AdminDocument> {
  constructor(@InjectModel(ADMIN_MODEL_NAME) model: Model<AdminDocument>) {
    super(model);
  }

  async findByAdminId(adminId: string): Promise<AdminDocument | null> {
    return this.findOne({ adminId } as FilterQuery<AdminDocument>);
  }

  async findByEmail(
    email: string,
    options: { includePassword?: boolean } = {},
  ): Promise<AdminDocument | null> {
    const q = this.model.findOne({ email: email.toLowerCase() });
    if (options.includePassword) {
      q.select("+password +passwordResetToken +passwordResetExpires");
    }
    return q.lean().exec() as Promise<AdminDocument | null>;
  }

  async findByResetToken(token: string): Promise<AdminDocument | null> {
    return this.model
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      })
      .select("+password")
      .lean()
      .exec() as Promise<AdminDocument | null>;
  }
}
