import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../lib/mongodb";
import axios from "axios"; // We'll use axios for making the API call

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
      tableDeliveryCharge,
    } = req.body;

    // Check database for user name
    const userData = await db.collection("UserData").findOne({ phoneNumber });
    if (userData && userData.name) {
      customerName = userData.name;
    }

    const collection = selectedLocation.includes("Sevoke Road")
      ? db.collection("OrderSevoke")
      : db.collection("OrderDagapur");

    // Get current date and time
    const now = new Date();

    const orderDocument = {
      items,
      selectedLocation,
      selectedCabin,
      total,
      appliedPromo,
      phoneNumber,
      customerName,
      tableDeliveryCharge: selectedLocation.includes("Sevoke Road")
        ? tableDeliveryCharge
        : undefined,
      status: "pending",
      order: "pending",
      createdAt: now,
      _id: new ObjectId(),
      load: "pending",
    };

    const result = await collection.insertOne(orderDocument);

    // Immediately send the response
    res.status(200).json({
      message: "Order submitted successfully",
      orderId: result.insertedId,
      orderDate: now.toISOString(),
      phoneNumber,
      customerName,
      tableDeliveryCharge: selectedLocation.includes("Sevoke Road")
        ? tableDeliveryCharge
        : undefined,
    });

    // After sending the response, make an API call to automateCall
    // Note: This will continue executing even after the response is sent
    try {
      await axios.post("/api/automateCall", { selectedLocation });
      console.log("AutomateCall API called successfully");
    } catch (error) {
      console.error("Error calling automateCall API:", error);
      // You might want to log this error or handle it in some way
    }
  } catch (error) {
    console.error("Error submitting order:", error);
    res.status(500).json({ message: "Error submitting order" });
  }
}
