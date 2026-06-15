import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DEVICE_PLATFORMS, NotificationType } from "@mbt/api-common";
import { Type } from "class-transformer";
import { IsEnum, IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class RegisterDeviceDto {
  @ApiProperty({ description: "App user id (`User.userId`)" })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  userId!: string;

  @ApiProperty({ description: "FCM registration token from the Android app" })
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  fcmToken!: string;

  @ApiPropertyOptional({ enum: DEVICE_PLATFORMS, example: "android" })
  @IsOptional()
  @IsIn([...DEVICE_PLATFORMS])
  platform?: string;

  @ApiPropertyOptional({ description: "Stable device id from the client" })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  appVersion?: string;
}

export class UnregisterDeviceDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  fcmToken!: string;
}

export class SendNotificationDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  userId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(256)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1024)
  body!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
