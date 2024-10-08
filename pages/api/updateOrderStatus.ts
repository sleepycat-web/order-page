import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../lib/mongodb";
import fetch from "node-fetch";

interface UpdateFields {
  order?: string;
  status?: string;
  dispatchedAt?: Date;
  fulfilledAt?: Date;
  rejectedAt?: Date;
  total?: number;
}

interface Fast2SMSResponse {
  return: boolean;
  request_id: string;
  message: string;
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
      const orderIdObj = new ObjectId(orderId);
      const sevokeOrder = await db
        .collection("OrderSevoke")
        .findOne({ _id: orderIdObj });
      collection = sevokeOrder
        ? db.collection("OrderSevoke")
        : db.collection("OrderDagapur");
      orderIdsToUpdate = [orderIdObj];
    } else if (orderIds) {
      orderIdsToUpdate = orderIds.map((id: string) => new ObjectId(id));
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
      updateFields.total = 0;
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

    // If the order is fulfilled, schedule SMS sending after 10 minutes
    if (type === "/payment") {
      for (const orderId of orderIdsToUpdate) {
        const order = await collection.findOne({ _id: orderId });
        if (order) {
           setTimeout(() => sendSMS(order), 600000); // 600,000 milliseconds = 10 minutes
        }
      }
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

async function sendSMS(order: any) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.error("FAST2SMS_API_KEY is not configured");
    return;
  }

  const url = "https://www.fast2sms.com/dev/bulkV2";
  const headers = {
    authorization: apiKey,
    "Content-Type": "application/json",
  };

  const firstName = order.customerName.split(" ")[0];
  const capitalizedFirstName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const body = {
    route: "dlt",
    sender_id: "CHMINE",
    message: "174072",
    variables_values: capitalizedFirstName,
    flash: 0,
    numbers: order.phoneNumber,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as Fast2SMSResponse;

    if (data.return !== true) {
      console.error(`Failed to send SMS:`, data.message);
    }
  } catch (error) {
    console.error(`Error sending SMS:`, error);
  }
}