import { MongoClient } from "mongodb";

let cachedClient = null;

export async function clientPromise() {
  if (cachedClient) return cachedClient;

  if (!process.env.MONGODB_KEY) {
    console.error("❌ MONGODB_KEY is missing.");
    throw new Error("MONGODB_KEY env variable not set.");
  }

  const client = new MongoClient(process.env.MONGODB_KEY);
  await client.connect();
  cachedClient = client;

  return client;
}

// Reusable helper: getCollection("Users"), getCollection("Orders"), etc.
export async function getCollection(name) {
  const client = await clientPromise();
  const db = client.db("DungeonSyncApp");
  return db.collection(name);
}