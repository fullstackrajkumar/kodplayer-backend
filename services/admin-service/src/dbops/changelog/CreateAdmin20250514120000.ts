import { MigrationInterface } from "mongo-migrate-ts";
import { Db, MongoClient } from "mongodb";
import { ADMINS_COLLECTION } from "../collections";
import { getAdminsFormattedData } from "../data";
import { _insertMany, withMongoTransaction } from "../dbops.helper";

export class CreateAdmin20250514120000 implements MigrationInterface {
  public async up(db: Db, client: MongoClient): Promise<void> {
    await withMongoTransaction(client, async (session) => {
      const adminData = await getAdminsFormattedData();
      const emails = adminData.map((a) => a.email);
      await db.collection(ADMINS_COLLECTION).deleteMany({ email: { $in: emails } }, { session });
      await _insertMany(db, ADMINS_COLLECTION, adminData as never[], session);
    });
  }

  public async down(db: Db, client: MongoClient): Promise<void> {
    await withMongoTransaction(client, async (session) => {
      const adminData = await getAdminsFormattedData();
      const emails = adminData.map((a) => a.email);
      await db.collection(ADMINS_COLLECTION).deleteMany({ email: { $in: emails } }, { session });
    });
  }
}
