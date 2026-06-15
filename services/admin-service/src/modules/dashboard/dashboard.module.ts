import { Module } from "@nestjs/common";
import { AdminJwtAuthGuard } from "../../guards/admin-jwt-auth.guard";
import { DashboardController } from "./dashboard.controller";
import { GetCountService } from "./services";

@Module({
  controllers: [DashboardController],
  providers: [GetCountService, AdminJwtAuthGuard],
})
export class DashboardModule {}
