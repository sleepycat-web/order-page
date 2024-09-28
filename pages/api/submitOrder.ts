import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../lib/mongodb";
import axios from "axios";

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

    // Get the active caller for the branch
    let branch;
    if (selectedLocation.includes("Sevoke Road")) {
      branch = "Sevoke Road";
    } else if (selectedLocation.includes("Dagapur")) {
      branch = "Dagapur";
    } else {
      return res.status(400).json({ message: "Invalid location" });
    }

    const selectedCaller = await db
      .collection("CallData")
      .findOne({ branch, callerStatus: true }, { sort: { dateUpdated: -1 } });

    if (!selectedCaller) {
      return res.status(404).json({ message: "No available caller found" });
    }

    const callerPhoneNumber = `${selectedCaller.phoneNumber}`;

    // Send SMS to the active caller
    await sendSMSNotification(
      selectedLocation,
      customerName,
      callerPhoneNumber
    );

    // Send the response
    // Send the response
    res.status(200).json({
      message: "Order submitted and notification sent successfully",
       orderDate: now.toISOString(),
    });
  } catch (error) {
    console.error("Error submitting order:", error);
    res.status(500).json({ message: "Error submitting order" });
  }
}

async function sendSMSNotification(
  selectedLocation: string,
  customerName: string,
  phoneNumber: string
): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    throw new Error("FAST2SMS API key is not configured");
  }

  const url = "https://www.fast2sms.com/dev/bulkV2";
  const headers = {
    authorization: apiKey,
    "Content-Type": "application/json",
  };

  const firstName = customerName.split(" ")[0];
  const locationName = selectedLocation.includes("Sevoke Road")
    ? "Sevoke Road"
    : "Dagapur";

  const body = {
    route: "dlt",
    sender_id: "CHMINE",
    message: "173671",
    variables_values: `${firstName}|${locationName}|`,
    flash: "0",
    numbers: phoneNumber,
  };

  try {
    const response = await axios.post(url, body, { headers });
    const data = response.data as Fast2SMSResponse;

    if (data.return !== true) {
      throw new Error(data.message || "Failed to send SMS notification");
    }
  } catch (error) {
    console.error("Error sending SMS notification:", error);
    throw error;
  }
}
