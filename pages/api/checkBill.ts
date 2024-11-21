import { NextApiRequest, NextApiResponse } from "next";
import { Document } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
 

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    try {
      const { db } = await connectToDatabase();
      const collections = ["OrderSevoke", "OrderDagapur"];
      let allOrders: Document[] = [];
      let pendingOrders: Document[] = [];

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);

        // Fetch pending orders first
        const pendingOrdersInCollection = await collection
          .find({
            phoneNumber,
            order: "pending",
          })
          .toArray();

        pendingOrders = pendingOrders.concat(pendingOrdersInCollection);

        // Fetch past orders, ensuring at least 10 total orders
        const pastOrders = await collection
          .find({
            phoneNumber,
            order: { $ne: "pending" }, // Exclude pending orders
          })
          .sort({ createdAt: -1 })
          .limit(Math.max(30 - pendingOrders.length, 0))
          .toArray();

        allOrders = allOrders.concat(pastOrders);
      }

      // Combine and sort orders
      allOrders = [...pendingOrders, ...allOrders];

      if (allOrders.length === 0) {
        return res
          .status(404)
          .json({ message: "No orders found for this phone number" });
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
    }  
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
