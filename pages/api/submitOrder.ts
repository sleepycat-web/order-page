import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../lib/mongodb";
import axios from "axios";
import nodemailer from "nodemailer";

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

    // Check if the order name starts with "Manual" (case insensitive)
    const isManualOrder = customerName.toLowerCase().startsWith("manual");

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
      order: isManualOrder ? "dispatched" : "pending",
      createdAt: now,
      _id: new ObjectId(),
      load: "pending",
      ...(isManualOrder && { dispatchedAt: now }), // Add dispatchedAt only for manual orders
    };

    const result = await collection.insertOne(orderDocument);

    // Send the response immediately after submitting the order
    res.status(200).json({
      message: "Order submitted successfully",
      orderDate: now.toISOString(),
    });

    // Perform the following operations asynchronously
    sendNotifications(db, orderDocument, selectedLocation).catch(console.error);
  } catch (error) {
    console.error("Error submitting order:", error);
    res.status(500).json({ message: "Error submitting order" });
  }
}

async function sendNotifications(
  db: any,
  orderDocument: any,
  selectedLocation: string
) {
  try {
    // Get the active caller for the branch
    let branch;
    if (selectedLocation.includes("Sevoke Road")) {
      branch = "Sevoke Road";
    } else if (selectedLocation.includes("Dagapur")) {
      branch = "Dagapur";
    } else {
      throw new Error("Invalid location");
    }

    const selectedCaller = await db
      .collection("CallData")
      .findOne({ branch, callerStatus: true }, { sort: { dateUpdated: -1 } });

    if (!selectedCaller) {
      throw new Error("No available caller found");
    }

    const callerPhoneNumber = `${selectedCaller.phoneNumber}`;

    const firstName = orderDocument.customerName.split(" ")[0];

    // Check if the first name is not "Manual" before sending SMS
    if (firstName.toLowerCase() !== "manual") {
      // Send SMS to the active caller
      await sendSMSNotification(
        selectedLocation,
        orderDocument.customerName,
        callerPhoneNumber
      );
    }

    // Send email confirmation
    await sendEmailConfirmation(orderDocument);
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
}
function getAdjustedTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}
async function sendEmailConfirmation(orderDetails: any): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Generate items list handling dynamic parameters
  const itemsList = orderDetails.items
    .map((orderItem: any) => {
      const itemName = orderItem.item?.name || "Item";
      const options = Object.entries(orderItem.selectedOptions || {})
        .map(([optionName, selectedValues]) => {
          const values = Array.isArray(selectedValues)
            ? selectedValues.join(", ")
            : selectedValues;
          return `- ${optionName}: ${values}`;
        })
        .join("\n    ");

      return `${itemName}
    ${options}
    - Quantity: ${orderItem.quantity}
    - Price: ₹${orderItem.totalPrice}
    ${
      orderItem.specialRequests
        ? `- Special Requests: ${orderItem.specialRequests}`
        : ""
    }`;
    })
    .join("\n\n");

  const emailContent = `
New Order Received!

Customer Details:
- Name: ${orderDetails.customerName}
- Phone Number: ${orderDetails.phoneNumber}
- Location: ${orderDetails.selectedLocation}
${orderDetails.selectedCabin ? `- Cabin: ${orderDetails.selectedCabin}` : ""}

Order Items:
${itemsList}

${
  orderDetails.tableDeliveryCharge
    ? `Table Delivery Charge: ₹${orderDetails.tableDeliveryCharge}`
    : ""
}
${
  orderDetails.appliedPromo
    ? `Applied Promo: ${
        typeof orderDetails.appliedPromo === "object"
          ? `${orderDetails.appliedPromo.code} (${orderDetails.appliedPromo.percentage}% off)`
          : orderDetails.appliedPromo
      }`
    : ""
}
Order Time: ${getAdjustedTime().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  })}
Total: ₹${orderDetails.total}
${
  orderDetails.order === "dispatched"
    ? "\nNote: This is a manual order and has been auto-dispatched."
    : ""
}
  `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `New Order Received at Chai Mine ${orderDetails.selectedLocation}`,
    text: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
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
