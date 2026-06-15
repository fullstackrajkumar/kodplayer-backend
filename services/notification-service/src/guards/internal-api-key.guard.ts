import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { NOTIFICATION_SERVICE_API_KEY } from "../constants/app.constant";

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers?: Record<string, string> }>();
    const key = req.headers?.["x-notification-api-key"] ?? req.headers?.["X-Notification-Api-Key"];
    if (!key || key !== NOTIFICATION_SERVICE_API_KEY) {
      throw new UnauthorizedException("Invalid notification API key");
    }
    return true;
  }
}
