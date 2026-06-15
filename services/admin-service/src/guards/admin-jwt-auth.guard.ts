import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { extractAccessTokenFromParts } from "../auth/extract-access-token";
import type { JwtPayload } from "../modules/auth/services";

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.getToken(request);
    if (!token) {
      throw new UnauthorizedException("Access token required");
    }
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (payload?.type !== "admin") {
        throw new UnauthorizedException("Invalid token");
      }
      (request as Request & { user: JwtPayload }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private getToken(request: Request): string | undefined {
    return extractAccessTokenFromParts({
      cookieHeader: request.headers.cookie,
      authorization: request.headers.authorization,
    });
  }
}
