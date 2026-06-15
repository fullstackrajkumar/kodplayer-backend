import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class AdminLoginDto {
  @ApiProperty({ example: "admin@qm-pizza.com" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "Admin@123456" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password!: string;
}

export class AdminForgotPasswordDto {
  @ApiProperty({ example: "admin@qm-pizza.com" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class AdminResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: "NewSecurePass123!" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  newPassword!: string;
}

export class AdminProfileResponseDto {
  /** Business id (matches JWT `sub` and `Admin.adminId`). */
  @ApiProperty()
  adminId!: string;

  @ApiProperty({ description: "Same as adminId (stable id for the admin account)." })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  profilePicture?: string;

  @ApiProperty({ enum: ["admin", "super_admin"] })
  role!: string;

  @ApiProperty()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Unix epoch milliseconds of last login (null if never).",
    example: 1747218900000,
    nullable: true,
  })
  lastLoginAt?: number | null;

  @ApiProperty({
    description: "Reserved for future RBAC; always empty until permission checks are enforced.",
    type: [String],
  })
  permissions!: string[];
}

export class AdminLoginResponseDto {
  @ApiProperty({ type: AdminProfileResponseDto })
  admin!: AdminProfileResponseDto;
}

export class AdminForgotPasswordResponseDto {
  @ApiProperty()
  message!: string;

  @ApiPropertyOptional()
  resetToken?: string;

  @ApiPropertyOptional({
    description: "Unix epoch milliseconds when the reset token expires.",
    example: 1747218900000,
  })
  resetTokenExpiresAt?: number;
}
