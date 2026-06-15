import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterUserDto {
  @ApiProperty({ example: "Jane Doe" })
  @IsString()
  @MinLength(1)
  fullName!: string;

  @ApiProperty({ example: "jane@example.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/avatar.png" })
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "Jane Doe" })
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @ApiPropertyOptional({ example: "jane@example.com" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "+15551234567" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/avatar.png" })
  @IsOptional()
  @IsString()
  profilePictureUrl?: string;
}
