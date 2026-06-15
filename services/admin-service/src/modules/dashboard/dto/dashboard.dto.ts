import { ApiProperty } from "@nestjs/swagger";

export class DashboardCountsDto {
  @ApiProperty()
  adminsCount!: number;

  @ApiProperty()
  appUsersCount!: number;
}
