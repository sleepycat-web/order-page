import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, Document } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = "ChaiMine";

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

    const client = new MongoClient(uri!);

    try {
      await client.connect();
      const db = client.db(dbName);
      const collections = ["OrderSevoke", "OrderDagpaur"];
      let allOrders: Document[] = [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        const orders = await collection
          .find({
            phoneNumber,
            createdAt: {
              $gte: today,
              $lt: tomorrow,
            },
          })
          .toArray();
        allOrders = allOrders.concat(orders);
      }

      if (allOrders.length === 0) {
        return res
          .status(404)
          .json({ message: "No orders found for this phone number today" });
      }

      // Ensure all required fields are present in the response
      const formattedOrders = allOrders.map((order) => ({
        ...order,
        tableDeliveryCharge: order.tableDeliveryCharge || 0,
        appliedPromo: order.appliedPromo || null,
      }));

      return res.status(200).json(formattedOrders);
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