import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { USER_ID_REQUEST_KEY } from "../constants/request-context";
import { isUuid } from "../utils/is-uuid";

export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<{ [USER_ID_REQUEST_KEY]?: string }>();
  const fromJwt = req[USER_ID_REQUEST_KEY];
  if (fromJwt && typeof fromJwt === "string" && isUuid(fromJwt.trim())) {
    return fromJwt.trim();
  }
  throw new UnauthorizedException("Sign in required");
});
