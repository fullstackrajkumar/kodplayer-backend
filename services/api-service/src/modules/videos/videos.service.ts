import { Injectable, NotFoundException } from "@nestjs/common";
import { VideoDbService, Video } from "@mbt/api-common";

@Injectable()
export class VideosService {
  constructor(private readonly videoDbService: VideoDbService) {}

  async findAllCompleted(): Promise<Video[]> {
    return this.videoDbService.find({ status: "COMPLETED" });
  }

  async findOne(videoId: string): Promise<Video> {
    const video = await this.videoDbService.updateOne(
      { videoId },
      { $inc: { views: 1 } }
    );
    if (!video) {
      throw new NotFoundException(`Video with ID ${videoId} not found`);
    }
    return video;
  }
}
