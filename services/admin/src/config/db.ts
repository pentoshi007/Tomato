import { Db, MongoClient } from "mongodb";

let client: MongoClient | undefined;
let db: Db | undefined;

export const connectDB = async (): Promise<Db> => {
  if (db) {
    return db;
  }

  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;
  if (!uri) {
    throw new Error("MONGO_URI is not defined");
  }
  if (!dbName) {
    throw new Error("DB_NAME is not defined");
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log("Admin service connected to MongoDB");

  return db;
};
