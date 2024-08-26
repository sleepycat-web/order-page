// pages/api/submitOrder.ts
import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { db } = await connectToDatabase();

    let {
      items,
      selectedLocation,
      selectedCabin,
      total,
      appliedPromo,
      phoneNumber,
      customerName,
    } = req.body;

    // Check database for user name
    const userData = await db.collection("UserData").findOne({ phoneNumber });
    if (userData && userData.name) {
      customerName = userData.name;
    }

    const collection = selectedLocation.includes("Sevoke Road")
      ? db.collection("OrderSevoke")
      : db.collection("OrderDagapur");

    // Create a specific date and time in IST
    const orderDate = new Date("2024-08-11T14:00:00+05:30");

    const orderDocument = {
      items,
      selectedLocation,
      selectedCabin,
      total,
      appliedPromo,
      phoneNumber,
      customerName,
      status: "pending",
      order: "pending",
      createdAt: orderDate,
      _id: new ObjectId(),
    };

    const result = await collection.insertOne(orderDocument);

    res.status(200).json({
      message: "Order submitted successfully",
      orderId: result.insertedId,
      orderDate: orderDate.toISOString(),
      phoneNumber,
      customerName,
    });
  } catch (error) {
    console.error("Error submitting order:", error);
    res.status(500).json({ message: "Error submitting order" });
  }
}
