import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  API_RESPONSE_400,
  API_RESPONSE_401,
  API_RESPONSE_500,
  ApiSuccessResponseMessage,
  CreateSignedUploadUrlDto,
  GcsService,
  SignedUploadUrlResponseDto,
} from "@mbt/api-common";
import { CurrentUserId } from "../../decorators/current-user-id.decorator";

/**
 * Folders an authenticated end-user (OTP-verified customer) is allowed to write to.
 *
 * NOTE intentionally narrow: customers must NEVER be able to upload into menu-items / branding /
 * categories. Those are admin folders and the admin-service has a separate allow-list for them.
 */
const APP_USER_ALLOWED_FOLDERS: ReadonlySet<string> = new Set(["users", "reviews"]);

@ApiTags("Uploads")
@Controller("uploads")
export class UploadsController {
  constructor(private readonly gcsService: GcsService) {}

  @Post("signed-url")
  @HttpCode(HttpStatus.OK)
  @ApiSuccessResponseMessage("Signed upload URL created")
  @ApiOperation({
    summary: "Create a short-lived signed PUT URL so the customer app can upload an image directly to GCS",
    description:
      "Authenticated end-users can upload to a small allow-list of folders (`users` for profile picture, `reviews` for review photos). The frontend PUTs the file body to `uploadUrl` with the exact `headers` returned, then calls the relevant CRUD endpoint with `publicUrl`.",
  })
  @ApiResponse({ status: 200, type: SignedUploadUrlResponseDto })
  @ApiResponse(API_RESPONSE_400)
  @ApiResponse(API_RESPONSE_401)
  @ApiResponse({ status: 503, description: "Upload service is not configured (GCS env missing)" })
  @ApiResponse(API_RESPONSE_500)
  async createSignedUrl(
    // `CurrentUserId` throws 401 when no valid app-user JWT is present —
    // that's our authentication gate for this endpoint.
    @CurrentUserId() _userId: string,
    @Body() dto: CreateSignedUploadUrlDto,
  ): Promise<SignedUploadUrlResponseDto> {
    const folder = dto.folder.trim().toLowerCase();
    if (!APP_USER_ALLOWED_FOLDERS.has(folder)) {
      throw new BadRequestException("folder is not permitted");
    }

    return this.gcsService.createSignedUploadUrl({
      folder,
      fileName: dto.fileName,
      contentType: dto.contentType,
      fileSize: dto.fileSize,
    });
  }
}
