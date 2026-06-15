import { Injectable, Logger } from "@nestjs/common";
import { VideoDbService, newUuid, Video, uuidToString } from "@mbt/api-common";
import { CreateVideoDto } from "./dto/create-video.dto";
import * as path from "path";
import * as fs from "fs";
import ffmpeg from "fluent-ffmpeg";

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(private readonly videoDbService: VideoDbService) {}

  async create(dto: CreateVideoDto): Promise<Video> {
    const videoId = newUuid();
    return this.videoDbService.create({
      videoId,
      title: dto.title,
      description: dto.description || "",
      thumbnailUrl: dto.thumbnailUrl || "",
      status: "PENDING",
      processingProgress: 0,
      hlsPlaylistPath: "",
      views: 0,
      duration: 0,
    });
  }

  async findAll(): Promise<Video[]> {
    return this.videoDbService.find({});
  }

  async getStatus(videoId: string): Promise<Video | null> {
    return this.videoDbService.findOne({ videoId });
  }

  startTranscoding(videoId: string | any, rawFilename: string): void {
    const videoIdStr = uuidToString(videoId);
    const uploadsDir = path.resolve(process.cwd(), "../../uploads");
    const rawPath = path.join(uploadsDir, "raw", rawFilename);
    const outputDir = path.join(uploadsDir, "hls", videoIdStr);

    // Ensure HLS output folders exist
    fs.mkdirSync(path.join(outputDir, "360p"), { recursive: true });
    fs.mkdirSync(path.join(outputDir, "720p"), { recursive: true });
    fs.mkdirSync(path.join(outputDir, "1080p"), { recursive: true });

    this.logger.log(`Starting HLS transcoding for video ${videoIdStr}. Input: ${rawPath}, Output: ${outputDir}`);

    this.videoDbService
      .updateOne({ videoId: videoIdStr }, { $set: { status: "PROCESSING", processingProgress: 0 } })
      .catch((err) => this.logger.error(`Failed to update status to PROCESSING: ${err.message}`));

    ffmpeg.ffprobe(rawPath, (err, metadata) => {
      if (err) {
        this.logger.error(`FFprobe failed for video ${videoIdStr}: ${err.message}`);
        this.markAsFailed(videoIdStr);
        return;
      }

      const duration = metadata?.format?.duration || 0;
      this.videoDbService
        .updateOne({ videoId: videoIdStr }, { $set: { duration: Math.round(duration) } })
        .catch((err) => this.logger.error(`Failed to update video duration: ${err.message}`));

      const hasAudio = metadata?.streams?.some((s) => s.codec_type === "audio") ?? false;

      const command = ffmpeg(rawPath)
        .addOption(
          "-filter_complex",
          "[0:v]split=3[v1][v2][v3];[v1]scale=w=640:h=360[v360];[v2]scale=w=1280:h=720[v720];[v3]scale=w=1920:h=1080[v1080]"
        );

      if (hasAudio) {
        command
          .addOption("-map", "[v360]")
          .addOption("-map", "0:a")
          .addOption("-map", "[v720]")
          .addOption("-map", "0:a")
          .addOption("-map", "[v1080]")
          .addOption("-map", "0:a")
          .addOption("-c:a", "aac")
          .addOption("-b:a:0", "128k")
          .addOption("-b:a:1", "192k")
          .addOption("-b:a:2", "192k");
      } else {
        command
          .addOption("-map", "[v360]")
          .addOption("-map", "[v720]")
          .addOption("-map", "[v1080]");
      }

      command
        .addOption("-c:v", "libx264")
        .addOption("-preset", "veryfast")
        .addOption("-b:v:0", "800k")
        .addOption("-b:v:1", "2800k")
        .addOption("-b:v:2", "5000k")
        .addOption("-f", "hls")
        .addOption("-hls_time", "6")
        .addOption("-hls_playlist_type", "vod")
        .addOption("-hls_segment_filename", path.join(outputDir, "%v/fileSequence%d.ts"))
        .addOption("-master_pl_name", "master.m3u8");

      if (hasAudio) {
        command.addOption(
          "-var_stream_map",
          "v:0,a:0,name:360p v:1,a:1,name:720p v:2,a:2,name:1080p"
        );
      } else {
        command.addOption("-var_stream_map", "v:0,name:360p v:1,name:720p v:2,name:1080p");
      }

      command.output(path.join(outputDir, "%v/playlist.m3u8"));

      let lastProgress = 0;

      command
        .on("progress", (progress) => {
          let percent = progress.percent;
          if (percent === undefined || isNaN(percent)) {
            percent = Math.min(99, lastProgress + 1);
          }
          percent = Math.round(percent);
          if (percent > lastProgress) {
            lastProgress = percent;
            this.videoDbService
              .updateOne({ videoId: videoIdStr }, { $set: { processingProgress: percent } })
              .catch((err) => this.logger.error(`Progress update failed: ${err.message}`));
          }
        })
        .on("end", () => {
          this.logger.log(`Transcoding completed for video ${videoIdStr}`);
          this.videoDbService
            .updateOne(
              { videoId: videoIdStr },
              {
                $set: {
                  status: "COMPLETED",
                  processingProgress: 100,
                  hlsPlaylistPath: `/uploads/hls/${videoIdStr}/master.m3u8`,
                },
              }
            )
            .catch((err) => this.logger.error(`Completed update failed: ${err.message}`));

          // Cleanup raw file after successful transcoding
          try {
            fs.unlinkSync(rawPath);
            this.logger.log(`Cleaned up raw upload at ${rawPath}`);
          } catch (e: any) {
            this.logger.warn(`Could not delete raw file ${rawPath}: ${e.message}`);
          }
        })
        .on("error", (err) => {
          this.logger.error(`Transcoding failed for video ${videoIdStr}: ${err.message}`);
          this.markAsFailed(videoIdStr);
        })
        .run();
    });
  }

  private markAsFailed(videoId: string): void {
    this.videoDbService
      .updateOne({ videoId }, { $set: { status: "FAILED" } })
      .catch((err) => this.logger.error(`Failed to update status to FAILED: ${err.message}`));
  }
}

