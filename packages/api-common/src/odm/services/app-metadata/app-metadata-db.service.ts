import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseDbService } from "../../db-service.base";
import {
  APP_METADATA_MODEL_NAME,
  APP_METADATA_SINGLETON_ID,
  AppMetadata,
  AppMetadataDocument,
} from "../../models/schemas/app-metadata.schema";

@Injectable()
export class AppMetadataDbService extends BaseDbService<AppMetadataDocument> {
  constructor(@InjectModel(APP_METADATA_MODEL_NAME) model: Model<AppMetadataDocument>) {
    super(model);
  }

  async getByMetadataId(metadataId: string): Promise<AppMetadata | null> {
    return this.findOne({ metadataId } as never);
  }

  async getSingleton(): Promise<AppMetadata | null> {
    return this.getByMetadataId(APP_METADATA_SINGLETON_ID);
  }

  /** Replace the document's entire `data` bag (creates doc if missing). */
  async setData(metadataId: string, data: Record<string, unknown>): Promise<AppMetadata> {
    const existing = await this.getByMetadataId(metadataId);
    if (!existing) {
      return this.create({ metadataId, data: { ...data } } as never);
    }

    const doc = await this.model
      .findOneAndUpdate({ metadataId }, { $set: { data: { ...data } } }, { new: true })
      .lean()
      .exec();
    return doc as AppMetadata;
  }
}
