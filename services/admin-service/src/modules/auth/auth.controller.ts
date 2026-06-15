import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { AdminDbService, API_RESPONSE_400, API_RESPONSE_500 } from "@mbt/api-common";
import {
  AdminForgotPasswordDto,
  AdminForgotPasswordResponseDto,
  AdminLoginDto,
  AdminLoginResponseDto,
  AdminProfileResponseDto,
  AdminResetPasswordDto,
} from "./dto/admin-auth.dto";
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_OPTIONS,
  COOKIE_REFRESH_TOKEN,
} from "../../constants/app.constant";
import { AdminJwtAuthGuard } from "../../guards/admin-jwt-auth.guard";
import { CurrentAdminId } from "../../decorators/current-admin-id.decorator";
import {
  ForgotPasswordService,
  LoginService,
  LogoutService,
  RefreshService,
  ResetPasswordService,
} from "./services";

function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return n * (multipliers[unit] ?? 86400000);
}

function toProfileResponse(admin: Record<string, unknown>): AdminProfileResponseDto {
  const lastLoginAtRaw = admin.lastLoginAt;
  const lastLoginAt: number | null =
    typeof lastLoginAtRaw === "number"
      ? lastLoginAtRaw
      : lastLoginAtRaw instanceof Date
        ? lastLoginAtRaw.getTime()
        : null;
  const adminId = String(
    admin.adminId ?? admin.id ?? (admin._id as { toString(): string })?.toString?.() ?? "",
  );
  return {
    adminId,
    id: adminId,
    name: String(admin.name),
    email: String(admin.email),
    profilePicture: admin.profilePicture as string | undefined,
    role: String(admin.role ?? "admin"),
    isActive: admin.isActive !== false,
    lastLoginAt,
    permissions: [],
  };
}

@ApiTags("Admin Auth")
@Controller("auth")
export class AdminAuthController {
  constructor(
    private readonly adminDb: AdminDbService,
    private readonly loginService: LoginService,
    private readonly logoutService: LogoutService,
    private readonly refreshService: RefreshService,
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly resetPasswordService: ResetPasswordService,
  ) {}

  @Get("me")
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth("accessToken")
  @ApiOperation({ summary: "Current admin session (same auth as all admin APIs)" })
  @ApiResponse({ status: 200, type: AdminLoginResponseDto })
  @ApiResponse({ status: 401 })
  @ApiResponse(API_RESPONSE_500)
  async me(@CurrentAdminId() adminId: string): Promise<{ admin: AdminProfileResponseDto }> {
    const doc = await this.adminDb.findByAdminId(adminId);
    if (!doc) {
      throw new UnauthorizedException("Admin not found");
    }
    return { admin: toProfileResponse(doc as unknown as Record<string, unknown>) };
  }

  @Post("login")
  @ApiOperation({ summary: "Admin login – sets access & refresh tokens in HTTP-only cookies" })
  @ApiResponse({ status: 200, type: AdminLoginResponseDto })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse(API_RESPONSE_400)
  @ApiResponse(API_RESPONSE_500)
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ admin: AdminProfileResponseDto }> {
    const { admin, accessToken, refreshToken, refreshTokenExpiresAt } =
      await this.loginService.login(dto.email, dto.password);

    const accessMaxAge = parseExpiryToMs(process.env.ACCESS_TOKEN_EXPIRES_IN || "15m");
    const refreshMaxAge = Math.floor((refreshTokenExpiresAt - Date.now()) / 1000);

    res.cookie(COOKIE_ACCESS_TOKEN, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: accessMaxAge,
    });
    res.cookie(COOKIE_REFRESH_TOKEN, refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: refreshMaxAge > 0 ? refreshMaxAge * 1000 : 7 * 24 * 60 * 60 * 1000,
    });

    return { admin: toProfileResponse(admin as unknown as Record<string, unknown>) };
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh tokens (rotation)" })
  @ApiResponse({ status: 200, description: "New cookies set" })
  @ApiResponse({ status: 401, description: "Invalid refresh" })
  @ApiResponse(API_RESPONSE_500)
  async refresh(
    @Req() req: { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ admin: AdminProfileResponseDto }> {
    const refreshToken = req.cookies?.[COOKIE_REFRESH_TOKEN];
    const { admin, accessToken, refreshToken: newRefreshToken, refreshTokenExpiresAt } =
      await this.refreshService.refresh(refreshToken ?? "");

    const accessMaxAge = parseExpiryToMs(process.env.ACCESS_TOKEN_EXPIRES_IN || "15m");
    const refreshMaxAge = Math.floor((refreshTokenExpiresAt - Date.now()) / 1000);

    res.cookie(COOKIE_ACCESS_TOKEN, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: accessMaxAge,
    });
    res.cookie(COOKIE_REFRESH_TOKEN, newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: refreshMaxAge > 0 ? refreshMaxAge * 1000 : 7 * 24 * 60 * 60 * 1000,
    });

    return { admin: toProfileResponse(admin as unknown as Record<string, unknown>) };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Logout" })
  @ApiResponse({ status: 204 })
  @ApiResponse(API_RESPONSE_500)
  async logout(
    @Req() req: { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies?.[COOKIE_REFRESH_TOKEN];
    await this.logoutService.logout(refreshToken ?? "");
    res.cookie(COOKIE_ACCESS_TOKEN, "", { ...COOKIE_OPTIONS, maxAge: 0 });
    res.cookie(COOKIE_REFRESH_TOKEN, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({ status: 200, type: AdminForgotPasswordResponseDto })
  @ApiResponse(API_RESPONSE_400)
  @ApiResponse(API_RESPONSE_500)
  async forgotPassword(@Body() dto: AdminForgotPasswordDto): Promise<AdminForgotPasswordResponseDto> {
    const result = await this.forgotPasswordService.forgotPassword(dto.email);
    return {
      message: result.message,
      ...(result.resetToken && { resetToken: result.resetToken }),
      ...(result.resetTokenExpiresAt !== undefined && {
        resetTokenExpiresAt: result.resetTokenExpiresAt,
      }),
    };
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 200 })
  @ApiResponse(API_RESPONSE_400)
  @ApiResponse(API_RESPONSE_500)
  async resetPassword(@Body() dto: AdminResetPasswordDto): Promise<{ message: string }> {
    await this.resetPasswordService.resetPassword(dto.token, dto.newPassword);
    return { message: "Password has been reset successfully." };
  }
}
