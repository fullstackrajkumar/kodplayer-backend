import { Module } from "@nestjs/common";
import { OdmModule } from "@mbt/api-common";
import { MetadataController } from "./metadata.controller";
import { MetadataService } from "./services/metadata.service";

@Module({
  imports: [OdmModule],
  controllers: [MetadataController],
  providers: [MetadataService],
})
export class MetadataModule {}
