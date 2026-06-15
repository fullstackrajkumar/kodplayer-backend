import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, UpdateQuery } from "mongoose";
import { BaseDbService } from "../../db-service.base";
import { USER_MODEL_NAME, UserDocument } from "../../models/schemas/user.schema";

@Injectable()
export class UserDbService extends BaseDbService<UserDocument> {
  constructor(@InjectModel(USER_MODEL_NAME) model: Model<UserDocument>) {
    super(model);
  }

  async findByUserId(userId: string): Promise<UserDocument | null> {
    return this.findOne({ userId } as FilterQuery<UserDocument>);
  }

  async findByPhoneNumber(phone: string): Promise<UserDocument | null> {
    return this.findOne({ phoneNumber: phone } as FilterQuery<UserDocument>);
  }

  async updateByUserId(
    userId: string,
    update: UpdateQuery<UserDocument>,
  ): Promise<UserDocument | null> {
    return this.updateOne({ userId } as FilterQuery<UserDocument>, update);
  }
}
