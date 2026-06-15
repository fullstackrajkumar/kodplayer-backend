import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseDbService } from "../../db-service.base";
import { VIDEO_MODEL_NAME, VideoDocument } from "../../models/schemas/video.schema";

@Injectable()
export class VideoDbService extends BaseDbService<VideoDocument> {
  constructor(@InjectModel(VIDEO_MODEL_NAME) model: Model<VideoDocument>) {
    super(model);
  }
}
