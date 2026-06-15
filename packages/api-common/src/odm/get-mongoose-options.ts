import { MongooseModuleAsyncOptions } from "@nestjs/mongoose";

export interface MongooseModuleOptionsConfig {
  uriKey?: string;
  connectionName?: string;
  connectionTimeoutMs?: number;
}

const DEFAULT_URI_KEY = "MONGODB_URI";

export function getMongooseForRootAsyncOptions(
  config: MongooseModuleOptionsConfig = {},
): MongooseModuleAsyncOptions {
  const {
    uriKey = DEFAULT_URI_KEY,
    connectionName,
    connectionTimeoutMs = 5000,
  } = config;

  const asyncOptions: MongooseModuleAsyncOptions = {
    useFactory: () => {
      const uri = process.env[uriKey] || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/your-app-name";
      const isProduction = process.env.NODE_ENV === "production";
      return {
        uri,
        serverSelectionTimeoutMS: connectionTimeoutMs,
        connectTimeoutMS: connectionTimeoutMs,
        /** Index definitions live in schemas; synced via `OdmIndexSyncService` in production. */
        autoIndex: !isProduction,
        autoCreate: !isProduction,
      };
    },
  };

  if (connectionName) {
    asyncOptions.connectionName = connectionName;
  }

  return asyncOptions;
}
