import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { API_RESPONSE_500 } from "@mbt/api-common";
import { APP_METADATA_RESPONSE_SCHEMA, AppMetadataData } from "./dto/metadata.dto";
import { MetadataService } from "./services/metadata.service";

@ApiTags("Metadata")
@Controller("metadata")
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get()
  @ApiOperation({ summary: "Get app metadata (public)" })
  @ApiResponse({ status: 200, schema: APP_METADATA_RESPONSE_SCHEMA })
  @ApiResponse(API_RESPONSE_500)
  get(): Promise<AppMetadataData> {
    return this.metadataService.get();
  }
}
