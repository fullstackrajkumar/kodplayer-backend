import { BadRequestException, Injectable } from "@nestjs/common";
import {
  APP_METADATA_SINGLETON_ID,
  AppMetadataDbService,
  emptyAppMetadata,
} from "@mbt/api-common";
import { AppMetadataData } from "./dto/metadata.dto";

const RESERVED_BODY_KEYS = new Set([
  "metadataId",
  "data",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "deletedBy",
  "_id",
  "__v",
  "id",
]);

function mapData(doc: unknown): AppMetadataData {
  const d = (doc && typeof doc === "object" ? doc : {}) as Record<string, unknown>;
  const rawData = d.data;
  if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
    return { ...(rawData as Record<string, unknown>) };
  }
  return {};
}

function bodyToData(body: Record<string, unknown>): AppMetadataData {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequestException("Request body must be a JSON object");
  }
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => !RESERVED_BODY_KEYS.has(key)),
  );
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

  /** PATCH body is flat `{ key1: value1, ... }`; stored as the whole `data` object. */
  async update(body: Record<string, unknown>): Promise<AppMetadataData> {
    const data = bodyToData(body);
    const updated = await this.appMetadataDb.setData(APP_METADATA_SINGLETON_ID, data);
    return mapData(updated);
  }
}
