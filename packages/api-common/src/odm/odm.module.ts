import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OdmIndexSyncService } from "./odm-index-sync.service";
import {
  ADMIN_MODEL_NAME,
  AdminSchema,
  USER_MODEL_NAME,
  UserSchema,
  USER_REFRESH_TOKEN_MODEL_NAME,
  UserRefreshTokenSchema,
  PHONE_OTP_CHALLENGE_MODEL_NAME,
  PhoneOtpChallengeSchema,
  REFRESH_TOKEN_MODEL_NAME,
  RefreshTokenSchema,
  APP_METADATA_MODEL_NAME,
  AppMetadataSchema,
  USER_DEVICE_MODEL_NAME,
  UserDeviceSchema,
  NOTIFICATION_MODEL_NAME,
  NotificationSchema,
  VIDEO_MODEL_NAME,
  VideoSchema,
} from "./models/schemas";
import {
  AdminDbService,
  UserDbService,
  PhoneOtpChallengeDbService,
  UserRefreshTokenDbService,
  RefreshTokenDbService,
  AppMetadataDbService,
  UserDeviceDbService,
  NotificationDbService,
  VideoDbService,
} from "./services";

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ADMIN_MODEL_NAME, schema: AdminSchema },
      { name: REFRESH_TOKEN_MODEL_NAME, schema: RefreshTokenSchema },
      { name: USER_MODEL_NAME, schema: UserSchema },
      { name: USER_REFRESH_TOKEN_MODEL_NAME, schema: UserRefreshTokenSchema },
      { name: PHONE_OTP_CHALLENGE_MODEL_NAME, schema: PhoneOtpChallengeSchema },
      { name: APP_METADATA_MODEL_NAME, schema: AppMetadataSchema },
      { name: USER_DEVICE_MODEL_NAME, schema: UserDeviceSchema },
      { name: NOTIFICATION_MODEL_NAME, schema: NotificationSchema },
      { name: VIDEO_MODEL_NAME, schema: VideoSchema },
    ]),
  ],
  providers: [
    OdmIndexSyncService,
    AdminDbService,
    RefreshTokenDbService,
    UserDbService,
    UserRefreshTokenDbService,
    PhoneOtpChallengeDbService,
    AppMetadataDbService,
    UserDeviceDbService,
    NotificationDbService,
    VideoDbService,
  ],
  exports: [
    AdminDbService,
    RefreshTokenDbService,
    UserDbService,
    UserRefreshTokenDbService,
    PhoneOtpChallengeDbService,
    AppMetadataDbService,
    UserDeviceDbService,
    NotificationDbService,
    VideoDbService,
  ],
})
export class OdmModule {}
