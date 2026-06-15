import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { API_RESPONSE_400, API_RESPONSE_500 } from "@mbt/api-common";
import { AdminJwtAuthGuard } from "../../guards/admin-jwt-auth.guard";
import { APP_METADATA_RESPONSE_SCHEMA, AppMetadataData } from "./dto/metadata.dto";
import { MetadataService } from "./metadata.service";

@ApiTags("Metadata")
@Controller("metadata")
@UseGuards(AdminJwtAuthGuard)
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get()
  @ApiBearerAuth("accessToken")
  @ApiOperation({ summary: "Get app metadata (singleton)" })
  @ApiResponse({ status: 200, schema: APP_METADATA_RESPONSE_SCHEMA })
  @ApiResponse({ status: 401 })
  @ApiResponse(API_RESPONSE_500)
  get(): Promise<AppMetadataData> {
    return this.metadataService.get();
  }

  @Patch()
  @ApiBearerAuth("accessToken")
  @ApiOperation({
    summary: "Replace app metadata",
    description:
      "Send a flat JSON object `{ key1: value1, key2: value2 }`. It replaces all stored metadata.",
  })
  @ApiBody({ schema: APP_METADATA_RESPONSE_SCHEMA })
  @ApiResponse({ status: 200, schema: APP_METADATA_RESPONSE_SCHEMA })
  @ApiResponse({ status: 401 })
  @ApiResponse(API_RESPONSE_400)
  @ApiResponse(API_RESPONSE_500)
  update(@Body() body: Record<string, unknown>): Promise<AppMetadataData> {
    return this.metadataService.update(body);
  }
}
