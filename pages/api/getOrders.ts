import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = "ChaiMine";

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { slug } = req.query;

  if (typeof slug !== "string") {
    return res.status(400).json({ error: "Invalid slug parameter" });
  }

  if (slug !== "sevoke" && slug !== "dagapur") {
    return res.status(400).json({ error: "Invalid location slug" });
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    const collection = slug === "sevoke" ? "OrderSevoke" : "OrderDagapur";

    // Get the current date in IST
    const now = new Date();
    // now.setHours(now.getHours() + 5); // Add 5 hours for IST
    now.setMinutes(now.getMinutes() - 30); // Add 30 minutes for IST

    // Set the start of the day (midnight) in IST
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await db
      .collection(collection)
      .find({
        createdAt: { $gte: startOfDay },
      })
      .toArray();

    res.status(200).json(orders);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  } finally {
    await client.close();
  }
}
