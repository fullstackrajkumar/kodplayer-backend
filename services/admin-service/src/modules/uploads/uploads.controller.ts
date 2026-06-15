import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  API_RESPONSE_400,
  API_RESPONSE_401,
  API_RESPONSE_500,
  ApiSuccessResponseMessage,
  CreateSignedUploadUrlDto,
  GcsService,
  SignedUploadUrlResponseDto,
} from "@mbt/api-common";
import { AdminJwtAuthGuard } from "../../guards/admin-jwt-auth.guard";

/**
 * Folders an authenticated admin is allowed to write to.
 *
 * Public app users go through `services/api-service` and have a *different* (smaller)
 * allow-list, so a customer JWT cannot mint upload URLs for, say, `menu-items/`.
 */
const ADMIN_ALLOWED_FOLDERS: ReadonlySet<string> = new Set([
  "menu-items",
  "branding",
  "categories",
  "rewards",
  "admins",
]);

@ApiTags("Uploads")
@Controller("uploads")
@UseGuards(AdminJwtAuthGuard)
export class AdminUploadsController {
  constructor(private readonly gcsService: GcsService) {}

  @Post("signed-url")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("accessToken")
  @ApiSuccessResponseMessage("Signed upload URL created")
  @ApiOperation({
    summary: "Create a short-lived signed PUT URL so the admin frontend can upload an asset directly to GCS",
    description:
      "Returns `uploadUrl` (signed PUT, ~5 min TTL), required `headers`, and the eventual `publicUrl` to persist on the related entity (e.g. menuItem.imageUrl). The frontend must PUT the file body to `uploadUrl` with the exact `headers` returned, then call the relevant CRUD endpoint with `publicUrl`.",
  })
  @ApiResponse({ status: 200, type: SignedUploadUrlResponseDto })
  @ApiResponse(API_RESPONSE_400)
  @ApiResponse(API_RESPONSE_401)
  @ApiResponse({ status: 503, description: "Upload service is not configured (GCS env missing)" })
  @ApiResponse(API_RESPONSE_500)
  async createSignedUrl(
    @Body() dto: CreateSignedUploadUrlDto,
  ): Promise<SignedUploadUrlResponseDto> {
    const folder = dto.folder.trim().toLowerCase();
    if (!ADMIN_ALLOWED_FOLDERS.has(folder)) {
      // Don't echo the rejected value back — keeps fuzzers from probing folders.
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
