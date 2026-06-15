import path from "node:path";
import dotenv from "dotenv";

const cwd = process.cwd();
dotenv.config({ path: path.resolve(cwd, "../../.env") });
dotenv.config({ path: path.resolve(cwd, ".env") });

import { mongoMigrateCli } from "mongo-migrate-ts";

const setupAndRunMigrations = async (): Promise<void> => {
  try {
    mongoMigrateCli({
      uri: process.env.MONGODB_URI,
      migrationsDir: __dirname,
      migrationsCollection: "changelog",
      migrationNameTimestampFormat: "yyyyMMddHHmmss",
    });
  } catch (error) {
    console.error("Migration error", error);
    process.exit(1);
  }
};

void setupAndRunMigrations();
