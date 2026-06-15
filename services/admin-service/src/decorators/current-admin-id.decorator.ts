import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "../modules/auth/services";

export const CurrentAdminId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
  return request.user?.sub ?? "";
});
