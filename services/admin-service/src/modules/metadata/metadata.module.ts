import { Module } from "@nestjs/common";
import { OdmModule } from "@mbt/api-common";
import { AdminJwtAuthGuard } from "../../guards/admin-jwt-auth.guard";
import { MetadataController } from "./metadata.controller";
import { MetadataService } from "./metadata.service";

@Module({
  imports: [OdmModule],
  controllers: [MetadataController],
  providers: [MetadataService, AdminJwtAuthGuard],
})
export class MetadataModule {}
