import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = "ChaiMine"; // Updated to use the correct database name

if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const client = new MongoClient(uri!); // Using non-null assertion as we've checked it above

    try {
      await client.connect();
      const db = client.db(dbName);

      const collections = ["OrderSevoke", "OrderDagpaur"];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        const order = await collection.findOne({
          phoneNumber: phoneNumber,
          createdAt: {
            $gte: today,
            $lt: tomorrow,
          },
        });

        if (order) {
          return res.status(200).json(order);
        }
      }

      return res.status(404).json({ message: "No orders found for today" });
    } catch (error) {
      console.error("Database error:", error);
      return res.status(500).json({ error: "Error connecting to database" });
    } finally {
      await client.close();
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
