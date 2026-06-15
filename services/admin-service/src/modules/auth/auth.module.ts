import { Module } from "@nestjs/common";
import { AdminAuthController } from "./auth.controller";
import { AdminJwtAuthGuard } from "../../guards/admin-jwt-auth.guard";
import {
  ForgotPasswordService,
  LoginService,
  LogoutService,
  RefreshService,
  ResetPasswordService,
} from "./services";

@Module({
  controllers: [AdminAuthController],
  providers: [
    LoginService,
    LogoutService,
    RefreshService,
    ForgotPasswordService,
    ResetPasswordService,
    AdminJwtAuthGuard,
  ],
  exports: [
    LoginService,
    LogoutService,
    RefreshService,
    ForgotPasswordService,
    ResetPasswordService,
  ],
})
export class AuthModule {}
