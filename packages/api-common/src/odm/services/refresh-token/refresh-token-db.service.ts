import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { BaseDbService } from "../../db-service.base";
import {
  REFRESH_TOKEN_MODEL_NAME,
  RefreshTokenDocument,
} from "../../models/schemas/refresh-token.schema";

@Injectable()
export class RefreshTokenDbService extends BaseDbService<RefreshTokenDocument> {
  constructor(
    @InjectModel(REFRESH_TOKEN_MODEL_NAME) model: Model<RefreshTokenDocument>,
  ) {
    super(model);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenDocument | null> {
    return this.model
      .findOne({ tokenHash, expiresAt: { $gt: Date.now() } })
      .lean()
      .exec() as Promise<RefreshTokenDocument | null>;
  }

  async deleteByTokenHash(tokenHash: string): Promise<boolean> {
    return this.deleteOne({ tokenHash } as FilterQuery<RefreshTokenDocument>);
  }

  async deleteAllByAdminId(adminId: string): Promise<number> {
    const result = await this.model.deleteMany({ adminId }).exec();
    return result.deletedCount ?? 0;
  }
}
