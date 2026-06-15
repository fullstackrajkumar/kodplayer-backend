/**
 * Standalone admin seeder: upserts seed rows from `dbops/data/admins.data.ts`
 * (replace by email, same behavior as migration `CreateAdmin20250514120000`).
 *
 * Usage: `npm run seed:admin` from `services/admin-service` (requires `MONGODB_URI`).
 */
import path from "node:path";
import dotenv from "dotenv";

const cwd = process.cwd();
dotenv.config({ path: path.resolve(cwd, "../../.env") });
dotenv.config({ path: path.resolve(cwd, ".env") });

import { MongoClient } from "mongodb";
import { ADMINS_COLLECTION } from "./collections";
import { getAdminsFormattedData } from "./data";
import { _insertMany, withMongoTransaction } from "./dbops.helper";

async function seedAdmins(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    console.error("[seed-admin] Set MONGODB_URI in .env (repo root or admin-service).");
    process.exit(1);
  }

  console.log("uri", uri);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  try {
    const adminData = await getAdminsFormattedData();
    const emails = adminData.map((a) => a.email);
    console.info(`[seed-admin] Replacing ${adminData.length} row(s) for email(s): ${emails.join(", ")}`);
    await db.collection(ADMINS_COLLECTION).deleteMany({ email: { $in: emails } });
    await db.collection(ADMINS_COLLECTION).insertMany(adminData as any[]);
    console.info("[seed-admin] Done.");
  } finally {
    await client.close();
  }
}

void seedAdmins().catch((err: unknown) => {
  console.error("[seed-admin] Failed:", err);
  process.exit(1);
});
