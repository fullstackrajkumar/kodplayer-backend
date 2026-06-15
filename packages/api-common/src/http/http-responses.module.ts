import { Global, Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ApiHttpExceptionFilter } from "./api-http-exception.filter";
import { SuccessEnvelopeInterceptor } from "./success-envelope.interceptor";

@Global()
@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: SuccessEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: ApiHttpExceptionFilter },
  ],
})
export class HttpResponsesModule {}
