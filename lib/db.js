import clientPromise from "./mongodb";

export const DB_NAME = "peacefulcorner";
export const COLLECTION_NAME = "peacefulcorner"; // keep exact

export async function getCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection(COLLECTION_NAME);
}
