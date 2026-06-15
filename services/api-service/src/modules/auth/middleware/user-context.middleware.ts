import { Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { COOKIE_APP_ACCESS_TOKEN, JWT_SECRET } from "../../../constants/app.constant";
import { USER_ID_REQUEST_KEY } from "../../../constants/request-context";
import type { UserJwtPayload } from "../services/auth-tokens.service";

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const url = req.originalUrl?.split("?")[0] ?? "";
    if (
      url.includes("/auth/send-otp") ||
      url.includes("/auth/verify-otp") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout")
    ) {
      return next();
    }

    const token = req.cookies?.[COOKIE_APP_ACCESS_TOKEN];
    if (!token || typeof token !== "string") {
      return next();
    }
    try {
      const payload = this.jwtService.verify<UserJwtPayload>(token, { secret: JWT_SECRET });
      if (payload?.type === "user" && typeof payload.sub === "string" && payload.sub.length > 0) {
        (req as Request & { [USER_ID_REQUEST_KEY]?: string })[USER_ID_REQUEST_KEY] = payload.sub;
      }
    } catch {
      // expired / invalid — protected routes will reject via CurrentUserId
    }
    next();
  }
}
