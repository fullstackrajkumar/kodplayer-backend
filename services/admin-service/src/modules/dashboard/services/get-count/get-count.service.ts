import { Injectable } from "@nestjs/common";
import { AdminDbService, UserDbService } from "@mbt/api-common";
import { DashboardCountsDto } from "../../dto/dashboard.dto";

@Injectable()
export class GetCountService {
  constructor(
    private readonly adminDb: AdminDbService,
    private readonly userDb: UserDbService,
  ) {}

  async getCounts(): Promise<DashboardCountsDto> {
    const [adminsCount, appUsersCount] = await Promise.all([
      this.adminDb.count(),
      this.userDb.count(),
    ]);
    return { adminsCount, appUsersCount };
  }
}
