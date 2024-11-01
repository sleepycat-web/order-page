import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../lib/mongodb";
   
 

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
    const collection = slug === "sevoke" ? "OrderSevoke" : "OrderDagapur";

    // Get the current date in IST
    const now = new Date();
    now.setHours(now.getHours() + 5); // Add 5 hours for IST
    now.setMinutes(now.getMinutes() + 30); // Add 30 minutes for IST

    // Set the start of the day (midnight) in IST
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const currentOrders = await db
      .collection(collection)
      .find({
        createdAt: { $gte: startOfDay },
      })
      .toArray();

    const payLaterOrders = await db
      .collection(collection)
      .find({
        createdAt: { $lt: startOfDay },
        order: "dispatched",
        status: { $ne: "fulfilled" },
      })
      .toArray();

    res.status(200).json({ currentOrders, payLaterOrders });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  } 
}
