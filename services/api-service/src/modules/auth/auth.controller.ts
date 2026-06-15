import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ApiSuccessResponseMessage, API_RESPONSE_400, API_RESPONSE_500 } from "@mbt/api-common";
import { Response } from "express";
import {
  COOKIE_APP_ACCESS_TOKEN,
  COOKIE_APP_REFRESH_TOKEN,
  COOKIE_OPTIONS,
  ACCESS_TOKEN_EXPIRES_IN,
} from "../../constants/app.constant";
import { SendOtpDto, SendOtpResponseDto, VerifyOtpDto } from "./dto/otp-auth.dto";
import { RefreshAuthDto } from "./dto/refresh-auth.dto";
import { AuthTokensService } from "./services/auth-tokens.service";
import { OtpAuthService, clientIpFromRequest } from "./services/otp-auth.service";
import { UserDeviceRegistrationService } from "./services/user-device-registration.service";
import { parseExpiryToMs } from "./utils/otp-crypto";
import type { User } from "@mbt/api-common";

function toPublicUser(u: User): {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl: string;
} {
  return {
    userId: u.userId,
    fullName: u.fullName,
    email: u.email ?? "",
    phoneNumber: u.phoneNumber ?? "",
    profilePictureUrl: u.profilePictureUrl ?? "",
  };
}

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly otpAuth: OtpAuthService,
    private readonly authTokens: AuthTokensService,
    private readonly deviceRegistration: UserDeviceRegistrationService,
  ) {}

  @Post("send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Send SMS OTP to phone (rate-limited; dev logs code when not production). Returns `challengeId` required for `verify-otp`.",
  })
  @ApiResponse({ status: 200, type: SendOtpResponseDto })
  @ApiResponse(API_RESPONSE_400)
  @ApiResponse(API_RESPONSE_500)
  @ApiSuccessResponseMessage("OTP sent")
  async sendOtp(
    @Body() dto: SendOtpDto,
    @Req() req: { ip?: string; headers?: Record<string, unknown> },
  ): Promise<SendOtpResponseDto> {
    const result = await this.otpAuth.sendOtp(dto, req);
    return {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt,
      resendAvailableInSec: result.resendAvailableInSec,
    };
  }

  @Post("verify-otp")
  @ApiOperation({
    summary: "Verify OTP — logs in existing user or registers default profile, sets auth cookies",
  })
  @ApiResponse(API_RESPONSE_400)
  @ApiResponse(API_RESPONSE_500)
  @ApiSuccessResponseMessage("Signed in")
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: { ip?: string; headers?: Record<string, unknown> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: ReturnType<typeof toPublicUser>; isNewUser: boolean }> {
    const { user, isNewUser, phone } = await this.otpAuth.verifyOtp(dto);
    const meta = {
      clientIp: clientIpFromRequest(req),
      deviceToken: dto.deviceToken?.trim() ?? "",
    };
    const { accessToken, refreshToken, refreshTokenExpiresAt } = await this.authTokens.issueTokenPair(
      user.userId,
      phone,
      meta,
    );
    const accessMaxAge = parseExpiryToMs(ACCESS_TOKEN_EXPIRES_IN);
    const refreshMaxAge = Math.max(
      0,
      Math.floor((refreshTokenExpiresAt - Date.now()) / 1000),
    );
    res.cookie(COOKIE_APP_ACCESS_TOKEN, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: accessMaxAge,
    });
    res.cookie(COOKIE_APP_REFRESH_TOKEN, refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: refreshMaxAge > 0 ? refreshMaxAge * 1000 : 7 * 24 * 60 * 60 * 1000,
    });
    await this.deviceRegistration.registerFromAuth(user.userId, meta.deviceToken, {
      platform: dto.platform,
      deviceId: dto.deviceId?.trim(),
      appVersion: dto.appVersion?.trim(),
    });
    return { user: toPublicUser(user), isNewUser };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate refresh token and set new HTTP-only cookies" })
  @ApiResponse({ status: 401, description: "Invalid refresh" })
  @ApiResponse(API_RESPONSE_500)
  @ApiSuccessResponseMessage("Tokens refreshed")
  async refresh(
    @Body() dto: RefreshAuthDto,
    @Req() req: { cookies?: Record<string, string>; ip?: string; headers?: Record<string, unknown> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: ReturnType<typeof toPublicUser> }> {
    const refreshToken = req.cookies?.[COOKIE_APP_REFRESH_TOKEN] ?? "";
    const meta = {
      clientIp: clientIpFromRequest(req),
      deviceToken: dto.deviceToken?.trim() ?? "",
    };
    const { user, accessToken, refreshToken: newRt, refreshTokenExpiresAt } =
      await this.authTokens.refresh(refreshToken, meta);
    const accessMaxAge = parseExpiryToMs(ACCESS_TOKEN_EXPIRES_IN);
    const refreshMaxAge = Math.max(
      0,
      Math.floor((refreshTokenExpiresAt - Date.now()) / 1000),
    );
    res.cookie(COOKIE_APP_ACCESS_TOKEN, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: accessMaxAge,
    });
    res.cookie(COOKIE_APP_REFRESH_TOKEN, newRt, {
      ...COOKIE_OPTIONS,
      maxAge: refreshMaxAge > 0 ? refreshMaxAge * 1000 : 7 * 24 * 60 * 60 * 1000,
    });
    await this.deviceRegistration.registerFromAuth(user.userId, meta.deviceToken, {
      platform: dto.platform,
      deviceId: dto.deviceId?.trim(),
      appVersion: dto.appVersion?.trim(),
    });
    return { user: toPublicUser(user) };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke refresh session and clear auth cookies" })
  @ApiResponse({ status: 204 })
  @ApiResponse(API_RESPONSE_500)
  async logout(
    @Req() req: { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies?.[COOKIE_APP_REFRESH_TOKEN] ?? "";
    await this.authTokens.revokeRefreshToken(refreshToken);
    res.cookie(COOKIE_APP_ACCESS_TOKEN, "", { ...COOKIE_OPTIONS, maxAge: 0 });
    res.cookie(COOKIE_APP_REFRESH_TOKEN, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  }
}
