import { MongoClient, Db } from "mongodb";

let db: Db | null = null;

const connectToDatabase = async (): Promise<Db> => {
  if (db) return db;

  const client = await MongoClient.connect(process.env.MONGODB_URI as string);
  db = client.db("ChaiMine");
  return db;
};

export const checkUserExists = async (
  phoneNumber: string
): Promise<boolean> => {
  const database = await connectToDatabase();
  const collection = database.collection("UserData");
  const user = await collection.findOne({ phoneNumber });
  return !!user;
};

export const addNewUser = async (
  phoneNumber: string,
  name: string,
  email?: string
): Promise<void> => {
  const database = await connectToDatabase();
  const collection = database.collection("UserData");
  await collection.insertOne({
    phoneNumber,
    name,
    email: email || null,
  });
};

export const getUserData = async (
  phoneNumber: string
): Promise<{ name: string; email?: string }> => {
  const database = await connectToDatabase();
  const collection = database.collection("UserData");
  const user = await collection.findOne({ phoneNumber });

  if (user) {
    return {
      name: user.name,
      email: user.email || undefined,
    };
  }

  throw new Error("User not found");
};
