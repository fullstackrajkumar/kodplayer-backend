import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

/**
 * Applies Mongoose schema indexes to MongoDB on startup (TTL, unique, etc.).
 * In production `autoIndex` is disabled; this keeps indexes in sync with code.
 */
@Injectable()
export class OdmIndexSyncService implements OnModuleInit {
  private readonly logger = new Logger(OdmIndexSyncService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit(): Promise<void> {
    if (process.env.MONGOOSE_SYNC_INDEXES === "false") {
      this.logger.log("MONGOOSE_SYNC_INDEXES=false — skipping index sync");
      return;
    }

    try {
      await this.connection.syncIndexes();
      this.logger.log("MongoDB indexes synced from Mongoose schemas");
    } catch (err) {
      this.logger.error("Failed to sync MongoDB indexes", err);
      if (process.env.NODE_ENV === "production") {
        throw err;
      }
    }
  }
}
