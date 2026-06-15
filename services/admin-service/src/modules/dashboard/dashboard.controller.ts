import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { API_RESPONSE_500 } from "@mbt/api-common";
import { AdminJwtAuthGuard } from "../../guards/admin-jwt-auth.guard";
import { DashboardCountsDto } from "./dto/dashboard.dto";
import { GetCountService } from "./services";

@ApiTags("Dashboard")
@Controller("dashboard")
@UseGuards(AdminJwtAuthGuard)
export class DashboardController {
  constructor(private readonly getCountService: GetCountService) {}

  @Get()
  @ApiBearerAuth("accessToken")
  @ApiOperation({ summary: "Aggregate counts for admin home" })
  @ApiResponse({ status: 200, type: DashboardCountsDto })
  @ApiResponse({ status: 401 })
  @ApiResponse(API_RESPONSE_500)
  async getCounts(): Promise<DashboardCountsDto> {
    return this.getCountService.getCounts();
  }
}
