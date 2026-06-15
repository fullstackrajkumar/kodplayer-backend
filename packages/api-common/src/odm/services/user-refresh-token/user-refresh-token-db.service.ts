import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { BaseDbService } from "../../db-service.base";
import {
  USER_REFRESH_TOKEN_MODEL_NAME,
  UserRefreshTokenDocument,
} from "../../models/schemas/user-refresh-token.schema";

@Injectable()
export class UserRefreshTokenDbService extends BaseDbService<UserRefreshTokenDocument> {
  constructor(
    @InjectModel(USER_REFRESH_TOKEN_MODEL_NAME) model: Model<UserRefreshTokenDocument>,
  ) {
    super(model);
  }

  async findByTokenHash(tokenHash: string): Promise<UserRefreshTokenDocument | null> {
    return this.model
      .findOne({ tokenHash, expiresAt: { $gt: Date.now() } })
      .lean()
      .exec() as Promise<UserRefreshTokenDocument | null>;
  }

  async deleteByTokenHash(tokenHash: string): Promise<boolean> {
    return this.deleteOne({ tokenHash } as FilterQuery<UserRefreshTokenDocument>);
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.model.deleteMany({ userId }).exec();
    return result.deletedCount ?? 0;
  }
}
