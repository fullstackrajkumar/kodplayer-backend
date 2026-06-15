import { Db, MongoClient, ClientSession } from "mongodb";

export async function withMongoTransaction<T>(
  client: MongoClient,
  fn: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = client.startSession();
  try {
    const result = await session.withTransaction(() => fn(session));
    return result as T;
  } finally {
    await session.endSession();
  }
}

export async function _insertMany<T extends Record<string, unknown>>(
  db: Db,
  collectionName: string,
  documents: T[],
  session?: ClientSession,
): Promise<void> {
  if (documents.length === 0) return;
  const collection = db.collection(collectionName);
  const options = session ? { session } : {};
  await collection.insertMany(documents as never[], options);
}

export function _getDateLogs(): { createdAt: number; updatedAt: number } {
  const nowMs = Date.now();
  return {
    createdAt: nowMs,
    updatedAt: nowMs,
  };
}
