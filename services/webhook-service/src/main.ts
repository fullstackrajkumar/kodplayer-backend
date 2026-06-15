import path from "node:path";
import dotenv from "dotenv";

const cwd = process.cwd();
dotenv.config({ path: path.resolve(cwd, "../../.env") });
dotenv.config({ path: path.resolve(cwd, ".env") });

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from "@nestjs/swagger";
import {
  isSwaggerEnabled,
  PROBES_GLOBAL_PREFIX_EXCLUDE,
  registerGracefulShutdown,
} from "@mbt/api-common";
import { AppModule } from "./app.module";
import { API_BASE_PATH, PORT } from "./constants/app.constant";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn", "log"],
    rawBody: true,
  });

  app.setGlobalPrefix(API_BASE_PATH, {
    exclude: PROBES_GLOBAL_PREFIX_EXCLUDE,
  });

  app.enableCors({ origin: true, methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS" });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerPath = "docs";
  if (isSwaggerEnabled()) {
    const swaggerSetupOptions: SwaggerCustomOptions = {
      useGlobalPrefix: true,
      jsonDocumentUrl: `${swaggerPath}/json`,
      yamlDocumentUrl: `${swaggerPath}/yaml`,
    };

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Your App Name – Webhook Service")
        .setDescription(
          "Payment gateway webhooks. Orders are created here on successful payment only.",
        )
        .setVersion("1.0")
        .build(),
    );

    SwaggerModule.setup(swaggerPath, app, document, swaggerSetupOptions);
  }

  await app.listen(Number(PORT));
  console.log(`[webhook-service] http://localhost:${PORT}  POST /${API_BASE_PATH}/razorpay`);

  registerGracefulShutdown(app, "webhook-service");
}

void bootstrap().catch((err) => {
  console.error("[webhook-service] Fatal:", err);
  process.exit(1);
});
