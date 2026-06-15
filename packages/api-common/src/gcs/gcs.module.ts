import { Global, Module } from "@nestjs/common";
import { GcsService } from "./gcs.service";

/**
 * Global so any feature module can `inject GcsService` without re-importing this module.
 * The service is stateless apart from a lazy `Storage` client cached on first use.
 */
@Global()
@Module({
  providers: [GcsService],
  exports: [GcsService],
})
export class GcsModule {}
