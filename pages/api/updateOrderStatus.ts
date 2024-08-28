import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../lib/mongodb";

interface UpdateFields {
  order?: string;
  status?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { db } = await connectToDatabase();

    const { orderId, type } = req.body;

    if (!orderId || !type) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    let collection;
    // Determine which collection to use based on the orderId
    const orderIdObj = new ObjectId(orderId);
    const sevokeOrder = await db
      .collection("OrderSevoke")
      .findOne({ _id: orderIdObj });
    if (sevokeOrder) {
      collection = db.collection("OrderSevoke");
    } else {
      collection = db.collection("OrderDagapur");
    }

    const updateFields: UpdateFields = {};

    if (type === "/dispatch") {
      updateFields.order = "dispatched";
    } else if (type === "/payment") {
      updateFields.status = "fulfilled";
    } else {
      return res.status(400).json({ message: "Invalid type parameter" });
    }

    const result = await collection.updateOne(
      { _id: orderIdObj },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Order not found or status not updated" });
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order status" });
  }
}
