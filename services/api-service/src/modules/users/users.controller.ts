import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { API_RESPONSE_500 } from "@mbt/api-common";
import { CurrentUserId } from "../../decorators/current-user-id.decorator";
import { RegisterUserDto, UpdateProfileDto } from "./dto/user.dto";
import { UsersService } from "./services/users.service";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Current user profile + stats" })
  @ApiResponse(API_RESPONSE_500)
  me(@CurrentUserId() userId: string): Promise<unknown> {
    return this.usersService.getProfile(userId);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update profile" })
  @ApiResponse(API_RESPONSE_500)
  patchMe(@CurrentUserId() userId: string, @Body() dto: UpdateProfileDto): Promise<unknown> {
    return this.usersService.updateProfile(userId, dto);
  }
}
