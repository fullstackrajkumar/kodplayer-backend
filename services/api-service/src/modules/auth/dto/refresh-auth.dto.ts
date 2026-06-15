import { ApiPropertyOptional } from "@nestjs/swagger";
import { DEVICE_PLATFORMS } from "@mbt/api-common";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class RefreshAuthDto {
  @ApiPropertyOptional({ description: "FCM token — updates push registration for this device" })
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

  @ApiPropertyOptional({ description: "Stable device id from the client" })
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
