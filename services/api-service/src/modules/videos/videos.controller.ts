import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { API_RESPONSE_500 } from "@mbt/api-common";
import { VideosService } from "./videos.service";

@ApiTags("Videos")
@Controller("videos")
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  @ApiOperation({ summary: "Get all completed videos for the streaming feed" })
  @ApiResponse({ status: 200, description: "List of completed videos" })
  @ApiResponse(API_RESPONSE_500)
  async getVideos() {
    return this.videosService.findAllCompleted();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get details of a specific video and increment views" })
  @ApiResponse({ status: 200, description: "Video details" })
  @ApiResponse({ status: 404, description: "Video not found" })
  @ApiResponse(API_RESPONSE_500)
  async getVideo(@Param("id") id: string) {
    return this.videosService.findOne(id);
  }
}
