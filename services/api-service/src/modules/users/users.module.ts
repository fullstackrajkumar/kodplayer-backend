import { Module } from "@nestjs/common";
import { OdmModule } from "@mbt/api-common";
import { UsersController } from "./users.controller";
import { UsersService } from "./services/users.service";

@Module({
  imports: [OdmModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
