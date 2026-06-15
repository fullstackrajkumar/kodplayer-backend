import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import { newUuid, API_RESPONSE_400, API_RESPONSE_401, API_RESPONSE_500, ApiSuccessResponseMessage } from "@mbt/api-common";
import { AdminJwtAuthGuard } from "../../guards/admin-jwt-auth.guard";
import { VideosService } from "./videos.service";
import { CreateVideoDto } from "./dto/create-video.dto";

@ApiTags("Videos")
@Controller("videos")
@UseGuards(AdminJwtAuthGuard)
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post("upload")
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth("accessToken")
  @ApiSuccessResponseMessage("Video upload initiated and transcoding started")
  @ApiOperation({
    summary: "Upload a raw video file and start background transcoding to HLS",
  })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = path.resolve(process.cwd(), "../../uploads/raw");
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const fileId = newUuid();
          const ext = path.extname(file.originalname);
          cb(null, `${fileId}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024 * 1024, // 5 GB limit
      },
    })
  )
  @ApiResponse({ status: 201, description: "Video record created" })
  @ApiResponse(API_RESPONSE_400)
  @ApiResponse(API_RESPONSE_401)
  @ApiResponse(API_RESPONSE_500)
  async uploadVideo(
    @UploadedFile() file: any,
    @Body() body: CreateVideoDto
  ) {
    if (!file) {
      throw new BadRequestException("Video file is required");
    }

    const video = await this.videosService.create(body);

    // Start transcoding in the background
    this.videosService.startTranscoding(video.videoId, file.filename);

    return video;
  }

  @Get()
  @ApiBearerAuth("accessToken")
  @ApiOperation({ summary: "Get all videos and their processing statuses" })
  async getVideos() {
    return this.videosService.findAll();
  }

  @Get(":id/status")
  @ApiBearerAuth("accessToken")
  @ApiOperation({ summary: "Get transcoding status of a specific video" })
  async getVideoStatus(@Param("id") id: string) {
    const video = await this.videosService.getStatus(id);
    if (!video) {
      throw new BadRequestException("Video not found");
    }
    return {
      videoId: video.videoId,
      status: video.status,
      processingProgress: video.processingProgress,
    };
  }
}
