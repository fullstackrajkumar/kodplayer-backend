import { MiddlewareConsumer, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  GcsModule,
  getMongooseForRootAsyncOptions,
  HttpResponsesModule,
  OdmModule,
  ProbesModule,
} from "@mbt/api-common";
import { AuthModule, MetadataModule, UploadsModule, UsersModule, VideosModule } from "./modules";

@Module({
  imports: [
    MongooseModule.forRootAsync(getMongooseForRootAsyncOptions()),
    HttpResponsesModule,
    ProbesModule,
    OdmModule,
    GcsModule,
    AuthModule,
    UsersModule,
    UploadsModule,
    MetadataModule,
    VideosModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply()
      .exclude(
        "/",
        "(.*)health(.*)",
        "(.*)startUpProbe(.*)",
        "(.*)livenessProbe(.*)",
        "(.*)readinessProbe(.*)",
        "health",
        "startUpProbe",
        "livenessProbe",
        "readinessProbe",
      )
      .forRoutes("*");
  }
}
