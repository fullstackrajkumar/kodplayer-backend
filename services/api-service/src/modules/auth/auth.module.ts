import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ACCESS_TOKEN_EXPIRES_IN, JWT_SECRET } from "../../constants/app.constant";
import { AuthController } from "./auth.controller";
import { UserContextMiddleware } from "./middleware/user-context.middleware";
import { AuthTokensService } from "./services/auth-tokens.service";
import { OtpAuthService } from "./services/otp-auth.service";
import { UserDeviceRegistrationService } from "./services/user-device-registration.service";

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
    }),
  ],
  controllers: [AuthController],
  providers: [OtpAuthService, AuthTokensService, UserDeviceRegistrationService, UserContextMiddleware],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(UserContextMiddleware).forRoutes("*");
  }
}
