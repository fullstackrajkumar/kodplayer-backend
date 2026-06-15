import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  getMongooseForRootAsyncOptions,
  HttpResponsesModule,
  OdmModule,
  ProbesModule,
} from "@mbt/api-common";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";

@Module({
  imports: [
    MongooseModule.forRootAsync(getMongooseForRootAsyncOptions()),
    HttpResponsesModule,
    ProbesModule,
    OdmModule,
    WebhooksModule,
  ],
})
export class AppModule {}
