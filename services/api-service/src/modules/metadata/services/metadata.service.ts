import { Injectable } from "@nestjs/common";
import { AppMetadataDbService, emptyAppMetadata } from "@mbt/api-common";
import { AppMetadataData } from "../dto/metadata.dto";

function mapData(doc: unknown): AppMetadataData {
  const d = (doc && typeof doc === "object" ? doc : {}) as Record<string, unknown>;
  const rawData = d.data;
  if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
    return { ...(rawData as Record<string, unknown>) };
  }
  return {};
}

@Injectable()
export class MetadataService {
  constructor(private readonly appMetadataDb: AppMetadataDbService) {}

  async get(): Promise<AppMetadataData> {
    const doc = await this.appMetadataDb.getSingleton();
    if (!doc) {
      return mapData(emptyAppMetadata());
    }
    return mapData(doc);
  }
}
