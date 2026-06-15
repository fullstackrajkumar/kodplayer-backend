import type { INestApplication } from "@nestjs/common";

const DEFAULT_SHUTDOWN_MS = 8000;

export function registerGracefulShutdown(
  app: INestApplication,
  serviceLabel: string,
  timeoutMs = DEFAULT_SHUTDOWN_MS,
): void {
  const shutdown = (signal: string) => {
    console.log(`[${serviceLabel}] ${signal}, closing...`);
    const forceExit = () => process.exit(1);
    const timeout = setTimeout(forceExit, timeoutMs);
    void app
      .close()
      .then(() => {
        clearTimeout(timeout);
        process.exit(0);
      })
      .catch(() => {
        clearTimeout(timeout);
        process.exit(1);
      });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
