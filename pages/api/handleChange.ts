import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient, ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { slug } = req.body;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ message: "Invalid slug" });
  }

  const dbName = "ChaiMine";

  try {
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(
      slug === "sevoke" ? "OrderSevoke" : "OrderDagapur"
    );

    // Find pending orders
    const pendingOrders = await collection.find({ load: "pending" }).toArray();

    // Update status of found orders
    const updatePromises = pendingOrders.map((order) =>
      collection.updateOne(
        { _id: new ObjectId(order._id) },
        { $set: { load: "loaded" } }
      )
    );

    await Promise.all(updatePromises);

    await client.close();

    res.status(200).json({
      message: "Orders processed successfully",
      processedOrders: pendingOrders,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
