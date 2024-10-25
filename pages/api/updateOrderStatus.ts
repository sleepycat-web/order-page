import { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../lib/mongodb";
import nodemailer from "nodemailer";
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

async function sendRejectionEmail(orders: any[]): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Function to generate items list for a single order
  const generateOrderDetails = (orderDetails: any) => {
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
          .join("\n        ");
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

    return `
Order Details:
- Name: ${orderDetails.customerName}
- Phone Number: ${orderDetails.phoneNumber}
- Location: ${orderDetails.selectedLocation}
${orderDetails.selectedCabin ? `- Cabin: ${orderDetails.selectedCabin}` : ""}

Items:
${itemsList}

${
  orderDetails.tableDeliveryCharge
    ? `Table Delivery Charge: ₹${orderDetails.tableDeliveryCharge}`
    : ""}
${
  orderDetails.appliedPromo
    ? `Applied Promo: ${
        typeof orderDetails.appliedPromo === "object"
          ? `${orderDetails.appliedPromo.code} (${orderDetails.appliedPromo.percentage}% off)`
          : orderDetails.appliedPromo}`: "" } `; };

  const emailContent = `
Orders Rejected! (${orders.length} ${orders.length === 1 ? "order" : "orders"})
Rejection Time: ${new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  })}${orders
  .map(
    (order, index) => `
Order #${index + 1}:
${generateOrderDetails(order)}
${index < orders.length - 1 ? "-------------------" : ""}`
  )
  .join("\n")}

Total Orders Rejected: ${orders.length}
 `.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `Order${orders.length > 1 ? "s" : ""} Rejected at Chai Mine`,
    text: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending rejection email:", error);
    throw error;
  }
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

      // Fetch all rejected orders
      const rejectedOrders = await collection
        .find({ _id: { $in: orderIdsToUpdate } })
        .toArray();

      if (rejectedOrders.length > 0) {
        try {
          // Send a single email for all rejected orders
          await sendRejectionEmail(rejectedOrders);
        } catch (error) {
          console.error("Failed to send rejection email:", error);
          // Continue with the update even if email fails
        }
      }
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

    // Original SMS logic for payment remains unchanged
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
