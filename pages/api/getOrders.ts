import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";

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

  try {
    const { db } = await connectToDatabase();
    const collectionName = slug === "sevoke" ? "OrderSevoke" : "OrderDagapur";
    const collection = db.collection(collectionName);

    // Existing logic to get current and pay later orders
   const now = new Date();
   now.setHours(now.getHours() + 5); // Add 5 hours for IST
   now.setMinutes(now.getMinutes() + 30); // Add 30 minutes for IST

   // Set the start of the day (midnight) in IST
   const startOfDay = new Date(now);
   startOfDay.setHours(0, 0, 0, 0);

    const currentOrders = await collection
      .find({ createdAt: { $gte: startOfDay } })
      .toArray();

    const payLaterOrders = await collection
      .find({
        createdAt: { $lt: startOfDay },
        order: "dispatched",
        status: { $ne: "fulfilled" },
      })
      .toArray();

    // Update mobile detection to include both Android and iOS
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(req.headers['user-agent'] || '');

    // New logic to process pending orders
    const pendingOrders = await collection.find({ load: "pending" }).toArray();

   if (!isMobile) { // Only update if not mobile
    const updatePromises = pendingOrders.map((order) =>
      collection.updateOne(
        { _id: new ObjectId(order._id) },
        { $set: { load: "loaded" } }
      )
    );

    await Promise.all(updatePromises);
  }

    res.status(200).json({
      currentOrders,
      payLaterOrders,
      processedOrders: pendingOrders,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}
