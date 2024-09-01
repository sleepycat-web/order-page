import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../lib/mongodb";

interface UpdateFields {
  order?: string;
  status?: string;
  dispatchedAt?: Date;
  fulfilledAt?: Date;
  rejectedAt?: Date;
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

    const { orderId, orderIds, type } = req.body;

    if ((!orderId && !orderIds) || !type) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    let collection;
    let orderIdsToUpdate: ObjectId[];

    if (orderId) {
      // Single order update
      const orderIdObj = new ObjectId(orderId);
      const sevokeOrder = await db
        .collection("OrderSevoke")
        .findOne({ _id: orderIdObj });
      collection = sevokeOrder
        ? db.collection("OrderSevoke")
        : db.collection("OrderDagapur");
      orderIdsToUpdate = [orderIdObj];
    } else if (orderIds) {
      // Multiple order update
      orderIdsToUpdate = orderIds.map((id: string) => new ObjectId(id));
      // Assume all orders are in the same collection for simplicity
      const sevokeOrder = await db
        .collection("OrderSevoke")
        .findOne({ _id: orderIdsToUpdate[0] });
      collection = sevokeOrder
        ? db.collection("OrderSevoke")
        : db.collection("OrderDagapur");
    } else {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    const updateFields: UpdateFields = {};
    const now = new Date();

    if (type === "/dispatch") {
      updateFields.order = "dispatched";
      updateFields.dispatchedAt = now;
    } else if (type === "/payment") {
      updateFields.status = "fulfilled";
      updateFields.fulfilledAt = now;
    } else if (type === "/reject") {
      updateFields.order = "rejected";
      updateFields.status = "rejected";
      updateFields.rejectedAt = now;
    } else {
      return res.status(400).json({ message: "Invalid type parameter" });
    }

    const result = await collection.updateMany(
      { _id: { $in: orderIdsToUpdate } },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "Order(s) not found or status not updated" });
    }

    res.status(200).json({
      message: "Order status updated successfully",
      updatedFields: updateFields,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order status" });
  }
}
