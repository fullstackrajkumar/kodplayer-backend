import { HydratedDocument, Model } from "mongoose";
import { BaseTimestamps, createSchema } from "../../schema.helper";
import { uuidField } from "../../uuid-fields";

export const VIDEO_MODEL_NAME = "Video";

export const VideoSchema = createSchema(
  {
    videoId: uuidField({ unique: true, index: true }),
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    thumbnailUrl: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    processingProgress: { type: Number, default: 0, min: 0, max: 100 },
    hlsPlaylistPath: { type: String, default: "", trim: true },
    duration: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "videos" },
);

export interface Video extends BaseTimestamps {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  processingProgress: number;
  hlsPlaylistPath: string;
  duration: number;
  views: number;
}

export type VideoDocument = HydratedDocument<Video>;
export interface VideoModel extends Model<VideoDocument> {}
