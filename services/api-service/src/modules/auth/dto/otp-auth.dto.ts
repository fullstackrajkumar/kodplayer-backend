import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DEVICE_PLATFORMS } from "@mbt/api-common";
import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

const E164_PHONE = /^\+\d{10,15}$/;

export class SendOtpDto {
  @ApiProperty({
    description: "Recipient phone number in valid format",
    example: "5551234567",
  })
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  phone!: string;
}

export class SendOtpResponseDto {
  @ApiProperty({ description: "Opaque challenge id; pass back to `verify-otp`" })
  challengeId!: string;

  @ApiProperty({
    description: "Unix epoch milliseconds at which the OTP expires",
    example: 1747218900000,
  })
  expiresAt!: number;

  @ApiProperty({ description: "Seconds until another `send-otp` is allowed for this phone" })
  resendAvailableInSec!: number;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: "Challenge id returned by `send-otp`",
    example: "f7f3d8a4-9b2c-4e7c-8f9a-1a2b3c4d5e6f",
  })
  @IsUUID("4", { message: "challengeId must be a v4 UUID returned by /auth/send-otp" })
  challengeId!: string;

  @ApiProperty({ description: "OTP code from SMS", example: "123456" })
  @IsString()
  @MinLength(4)
  @MaxLength(10)
  code!: string;

  @ApiPropertyOptional({ description: "FCM registration token — registers this device for push (optional)" })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  deviceToken?: string;

  @ApiPropertyOptional({
    description: "Client platform",
    enum: DEVICE_PLATFORMS,
    example: "android",
  })
  @IsOptional()
  @IsIn([...DEVICE_PLATFORMS])
  platform?: string;

  @ApiPropertyOptional({ description: "Stable device id from the client (optional)" })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  deviceId?: string;

  @ApiPropertyOptional({ description: "App version string, e.g. 1.2.0 (optional)" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  appVersion?: string;
}
