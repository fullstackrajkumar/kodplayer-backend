import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  getMongooseForRootAsyncOptions,
  HttpResponsesModule,
  OdmModule,
  ProbesModule,
} from "@mbt/api-common";
import { NotificationsModule } from "./modules/notifications/notifications.module";

@Module({
  imports: [
    MongooseModule.forRootAsync(getMongooseForRootAsyncOptions()),
    HttpResponsesModule,
    ProbesModule,
    OdmModule,
    NotificationsModule,
  ],
})
export class AppModule {}
