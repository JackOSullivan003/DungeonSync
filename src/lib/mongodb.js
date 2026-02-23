import { MongoClient } from "mongodb"; // MongoDB client library

let cachedClient = null; // store a single shared client to avoid reconnecting every time

export async function clientPromise() {
  if (cachedClient) return cachedClient; // reuse existing connection if available

  if (!process.env.MONGODB_KEY) {
    console.error("MONGODB_KEY is missing."); // log if env variable is missing
    throw new Error("MONGODB_KEY env variable not set.");
  }

  const client = new MongoClient(process.env.MONGODB_KEY); // create MongoDB client
  await client.connect(); // connect to database
  cachedClient = client; // save client for future calls

  return client;
}

// Reusable helper: getCollection("Users"), getCollection("Campaigns"), etc.
export async function getCollection(name) {
  const client = await clientPromise(); // get connected MongoDB client
  const db = client.db("DungeonSyncApp"); // select database
  return db.collection(name); // return requested collection
}