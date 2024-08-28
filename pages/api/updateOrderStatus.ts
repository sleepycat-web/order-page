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

    const { orderId, type, phoneNumber } = req.body;

    if ((!orderId && !phoneNumber) || !type) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    let collection;
    let filter: any = {};

    if (orderId) {
      // Single order update
      const orderIdObj = new ObjectId(orderId);
      const sevokeOrder = await db
        .collection("OrderSevoke")
        .findOne({ _id: orderIdObj });
      collection = sevokeOrder
        ? db.collection("OrderSevoke")
        : db.collection("OrderDagapur");
      filter = { _id: orderIdObj };
    } else if (phoneNumber) {
      // Bulk update for a phone number
      // We'll update both collections to ensure all orders are covered
      collection = db.collection("OrderDagapur");
      filter = { phoneNumber: phoneNumber };
    } else {
      return res.status(400).json({ message: "Invalid parameters" });
    }

    const updateFields: UpdateFields = {};

    if (type === "/dispatch" || type === "/dispatchAll") {
      updateFields.order = "dispatched";
    } else if (type === "/payment" || type === "/fulfillAll") {
      updateFields.status = "fulfilled";
    } else {
      return res.status(400).json({ message: "Invalid type parameter" });
    }

    let result;
    if (phoneNumber) {
      // Update in OrderDagapur
      result = await db
        .collection("OrderDagapur")
        .updateMany(filter, { $set: updateFields });

      // Update in OrderSevoke
      await db
        .collection("OrderSevoke")
        .updateMany(filter, { $set: updateFields });
    } else {
      // Single order update
      result = await collection.updateOne(filter, { $set: updateFields });
    }

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Order(s) not found or status not updated" });
    }

    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order status" });
  }
}
