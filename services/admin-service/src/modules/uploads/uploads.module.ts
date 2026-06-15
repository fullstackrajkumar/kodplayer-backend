import { Module } from "@nestjs/common";
import { AdminJwtAuthGuard } from "../../guards/admin-jwt-auth.guard";
import { AdminUploadsController } from "./uploads.controller";

/**
 * Admin-side `/uploads/signed-url`. The actual `GcsService` comes from the global
 * `GcsModule` registered in the app module — no need to re-import it here.
 */
@Module({
  controllers: [AdminUploadsController],
  providers: [AdminJwtAuthGuard],
})
export class AdminUploadsModule {}
