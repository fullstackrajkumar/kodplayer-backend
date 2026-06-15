import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  GcsModule,
  getMongooseForRootAsyncOptions,
  HttpResponsesModule,
  OdmModule,
  ProbesModule,
} from "@mbt/api-common";
import { CoreModule } from "./core.module";
import {
  AdminUploadsModule,
  AuthModule,
  DashboardModule,
  MetadataModule,
  VideosModule,
} from "./modules";

@Module({
  imports: [
    MongooseModule.forRootAsync(getMongooseForRootAsyncOptions()),
    HttpResponsesModule,
    ProbesModule,
    OdmModule,
    GcsModule,
    CoreModule,
    AuthModule,
    DashboardModule,
    AdminUploadsModule,
    MetadataModule,
    VideosModule,
  ],
})
export class AppModule {}
