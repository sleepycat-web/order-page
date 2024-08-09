import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { location, cabin, timestamp } = req.body;

    if (!location || !cabin) {
      return res.status(400).json({ error: "Location and cabin are required" });
    }

    try {
      const { db } = await connectToDatabase();
      let collectionName: string;

      if (location === "Sevoke Road") {
        collectionName = "OrderSevoke";
      } else if (location === "Dagapur") {
        collectionName = "OrderDagapur";
      } else {
        return res.status(400).json({ error: "Invalid location" });
      }

      const collection = db.collection(collectionName);

      // Generate IST timestamp if not provided

      const result = await collection.insertOne({
        location,
        cabin,
        timestamp
      });

      res.status(200).json({
        message: "Order submitted successfully",
        orderId: result.insertedId,
      });
    } catch (error) {
      console.error("Error submitting order:", error);
      res.status(500).json({ error: "Failed to submit order" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}


