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

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        const orders = await collection
          .find({
            phoneNumber,
          })
          .sort({ createdAt: -1 }) // Sort by createdAt in descending order
          .limit(10) // Limit to last 10 orders per collection
          .toArray();
        allOrders = allOrders.concat(orders);
      }

      if (allOrders.length === 0) {
        return res
          .status(404)
          .json({ message: "No orders found for this phone number" });
      }

      // Sort all orders by createdAt in descending order
      allOrders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

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
