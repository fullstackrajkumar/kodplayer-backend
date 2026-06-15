import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { BaseDbService } from "../../db-service.base";
import {
  PHONE_OTP_CHALLENGE_MODEL_NAME,
  PhoneOtpChallengeDocument,
} from "../../models/schemas/phone-otp-challenge.schema";

@Injectable()
export class PhoneOtpChallengeDbService extends BaseDbService<PhoneOtpChallengeDocument> {
  constructor(
    @InjectModel(PHONE_OTP_CHALLENGE_MODEL_NAME) model: Model<PhoneOtpChallengeDocument>,
  ) {
    super(model);
  }

  async upsertByPhone(phone: string, set: Record<string, unknown>): Promise<void> {
    await this.model
      .updateOne({ phone } as FilterQuery<PhoneOtpChallengeDocument>, { $set: { ...set, phone } }, {
        upsert: true,
      })
      .exec();
  }

  async findByChallengeId(challengeId: string): Promise<PhoneOtpChallengeDocument | null> {
    return this.findOne({ challengeId } as FilterQuery<PhoneOtpChallengeDocument>);
  }

  async deleteByPhone(phone: string): Promise<boolean> {
    return this.deleteOne({ phone } as FilterQuery<PhoneOtpChallengeDocument>);
  }

  async deleteByChallengeId(challengeId: string): Promise<boolean> {
    return this.deleteOne({ challengeId } as FilterQuery<PhoneOtpChallengeDocument>);
  }
}
