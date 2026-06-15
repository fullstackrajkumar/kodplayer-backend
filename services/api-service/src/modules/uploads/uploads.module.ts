import { Module } from "@nestjs/common";
import { UploadsController } from "./uploads.controller";

/**
 * Customer-side `/uploads/signed-url`. The actual `GcsService` comes from the global
 * `GcsModule` registered in the app module.
 *
 * Auth is enforced via `@CurrentUserId()` inside the controller (same pattern other
 * authenticated routes in this service use), which reads the user JWT attached by
 * `UserContextMiddleware` and throws 401 when missing.
 */
@Module({
  controllers: [UploadsController],
})
export class UploadsModule {}
