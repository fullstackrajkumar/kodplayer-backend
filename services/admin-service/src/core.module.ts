import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ACCESS_TOKEN_EXPIRES_IN, JWT_SECRET } from "./constants/app.constant";

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: ACCESS_TOKEN_EXPIRES_IN },
    }),
  ],
  exports: [JwtModule],
})
export class CoreModule {}
