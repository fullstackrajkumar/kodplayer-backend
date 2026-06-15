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
import cookieParser from "cookie-parser";
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

  app.useStaticAssets(path.resolve(process.cwd(), "../../uploads"), {
    prefix: "/uploads",
    setHeaders: (res, filePath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      if (filePath.endsWith(".m3u8")) {
        res.setHeader("Content-Type", "application/x-mpegURL");
      } else if (filePath.endsWith(".ts")) {
        res.setHeader("Content-Type", "video/MP2T");
      }
    },
  });

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
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, x-admin-realtime-api-key");
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

    const swaggerDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Your App Name – Public API")
        .setDescription(
          "Public customer API: catalog, cart, orders, addresses, OTP auth (`POST /auth/send-otp`, `POST /auth/verify-otp` set `appAccessToken` / `appRefreshToken` cookies), and profile. JSON responses use a shared envelope: success `{ success, statusCode, message, data, meta }` (`message` is set per route via `@ApiSuccessResponseMessage()` from `@mbt/api-common`, otherwise `null`); errors `{ success, statusCode, error: { code, message, fieldErrors? }, meta }` (probes and `/docs` stay unwrapped).",
        )
        .setVersion("1.0")
        .build(),
      {},
    );

    SwaggerModule.setup(swaggerPath, app, swaggerDocument, swaggerSetupOptions);
  }

  await app.listen(Number(PORT));
  const swaggerHint = isSwaggerEnabled()
    ? `  Swagger: /${API_BASE_PATH}/${swaggerPath}`
    : "";
  console.log(`[api-service] http://localhost:${PORT}  health: /health${swaggerHint}`);

  registerGracefulShutdown(app, "api-service");
}

void bootstrap().catch((err) => {
  console.error("[api-service] Fatal:", err);
  process.exit(1);
});
