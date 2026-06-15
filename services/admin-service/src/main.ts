import path from "node:path";
import dotenv from "dotenv";

const cwd = process.cwd();
dotenv.config({ path: path.resolve(cwd, "../../.env") });
dotenv.config({ path: path.resolve(cwd, ".env") });

import cookieParser from "cookie-parser";
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
  });

  app.setGlobalPrefix(API_BASE_PATH, {
    exclude: PROBES_GLOBAL_PREFIX_EXCLUDE,
  });

  app.set("trust proxy", 1);

  app.use(cookieParser());
  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
    
    const reqHeaders = req.headers["access-control-request-headers"];
    if (reqHeaders) {
      res.header("Access-Control-Allow-Headers", reqHeaders);
    } else {
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
    }
    
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Private-Network", "true");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

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
        .setTitle("KodPlayer – Admin API")
        .setDescription(
          "JSON responses use a shared envelope: success `{ success, statusCode, message, data, meta }` (`message` from `@ApiSuccessResponseMessage()` or `null`); errors `{ success, statusCode, error: { code, message, fieldErrors? }, meta }` (probes and `/docs` stay unwrapped). " +
            "Auth is only on this service: `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout` (cookies + optional Bearer).",
        )
        .setVersion("1.0")
        .addBearerAuth(
          { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
          "accessToken",
        )
        .build(),
    );

    SwaggerModule.setup(swaggerPath, app, document, swaggerSetupOptions);
  }

  await app.listen(Number(PORT));
  console.log(`[admin-service] http://localhost:${PORT}`);

  registerGracefulShutdown(app, "admin-service");
}

void bootstrap().catch((err) => {
  console.error("[admin-service] Fatal:", err);
  process.exit(1);
});
