import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { DevicePlatform } from "../../../common/constants/notification.constants";
import { BaseDbService } from "../../db-service.base";
import {
  USER_DEVICE_MODEL_NAME,
  UserDevice,
  UserDeviceDocument,
} from "../../models/schemas/user-device.schema";

export interface RegisterUserDeviceInput {
  userId: string;
  fcmToken: string;
  platform?: DevicePlatform | string;
  deviceId?: string;
  appVersion?: string;
}

@Injectable()
export class UserDeviceDbService extends BaseDbService<UserDeviceDocument> {
  constructor(@InjectModel(USER_DEVICE_MODEL_NAME) model: Model<UserDeviceDocument>) {
    super(model);
  }

  /**
   * Upsert by FCM token so reinstalls update the same row; re-login on another phone adds another row.
   */
  async registerDevice(input: RegisterUserDeviceInput): Promise<UserDevice> {
    const fcmToken = input.fcmToken.trim();
    if (!fcmToken) {
      throw new Error("fcmToken is required");
    }
    const nowMs = Date.now();
    const doc = await this.model
      .findOneAndUpdate(
        { fcmToken },
        {
          $set: {
            userId: input.userId,
            fcmToken,
            ...(input.platform
              ? { platform: input.platform.trim() }
              : {}),
            deviceId: input.deviceId?.trim() ?? "",
            appVersion: input.appVersion?.trim() ?? "",
            lastSeenAt: nowMs,
            deletedAt: null,
            deletedBy: null,
          },
        },
        { upsert: true, new: true },
      )
      .lean()
      .exec();
    return doc as UserDevice;
  }

  /** All active FCM tokens for a user (multi-device). */
  async findFcmTokensByUserId(userId: string): Promise<string[]> {
    const rows = await this.model
      .find({ userId, fcmToken: { $ne: "" }, deletedAt: null })
      .select("fcmToken")
      .lean()
      .exec();
    const tokens = rows
      .map((r) => String((r as { fcmToken?: string }).fcmToken ?? "").trim())
      .filter((t) => t.length > 0);
    return [...new Set(tokens)];
  }

  async removeByFcmToken(fcmToken: string): Promise<boolean> {
    return this.deleteOne({ fcmToken: fcmToken.trim() } as never);
  }
}
