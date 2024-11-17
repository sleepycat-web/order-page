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
  items?: any[];
  tableDeliveryCharge?: number;
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

async function sendRejectionEmail(
  orders: any[],
  isPartial: boolean = false
): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const generateOrderDetails = (orderDetails: any, rejectedItems?: any[]) => {
    const itemsList = (rejectedItems || orderDetails.items)
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

${isPartial ? "Rejected Items:" : "Items:"}
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
}`;
  };

  const emailContent = `
${isPartial ? "Orders Partially Rejected!" : "Orders Rejected!"} (${
    orders.length
  } ${orders.length === 1 ? "order" : "orders"})
Rejection Time: ${new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  })}${orders
    .map(
      (order, index) => `
Order #${index + 1}:
${generateOrderDetails(order, order.rejectedItems)}
${index < orders.length - 1 ? "-------------------" : ""}`
    )
    .join("\n")}

Total ${isPartial ? "Partial " : ""}Orders Rejected: ${orders.length}
${
  isPartial
    ? "\nNote: The remaining items in these orders will be processed as usual."
    : ""
}
`.trim();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `Order${orders.length > 1 ? "s" : ""} ${
      isPartial ? "Partially " : ""
    }Rejected at Chai Mine`,
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

    const { orderId, orderIds, type, itemsToRemove } = req.body;

    if ((!orderId && !orderIds) || !type) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    let collection;
    let orderIdObj: ObjectId;

    if (orderId) {
      orderIdObj = new ObjectId(orderId);
      const sevokeOrder = await db
        .collection("OrderSevoke")
        .findOne({ _id: orderIdObj });
      collection = sevokeOrder
        ? db.collection("OrderSevoke")
        : db.collection("OrderDagapur");
    } else {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    const updateFields: UpdateFields = {};
    const now = new Date();

   if (type === "/remove" && itemsToRemove) {
     // Fetch the original order
     const originalOrder = await collection.findOne({ _id: orderIdObj });
     if (!originalOrder) {
       return res.status(404).json({ message: "Order not found" });
     }

     // If order has only one item, or all items are being removed, reject the entire order
     if (
       originalOrder.items.length === 1 ||
       itemsToRemove.length === originalOrder.items.length
     ) {
       updateFields.order = "rejected";
       updateFields.status = "rejected";
       updateFields.rejectedAt = now;
       updateFields.total = 0;
       updateFields.tableDeliveryCharge = 0;

       const result = await collection.updateOne(
         { _id: orderIdObj },
         { $set: updateFields }
       );

       // Send rejection email for the fully rejected order
       try {
         await sendRejectionEmail([originalOrder], false);
       } catch (error) {
         console.error("Failed to send rejection email:", error);
       }

       return res.status(200).json({
         message: "Order rejected successfully",
         updatedFields: updateFields,
         modifiedCount: result.modifiedCount,
       });
     }

     // For multiple items, handle partial removal
     const remainingItems = originalOrder.items.filter(
       (item: any, index: number) => !itemsToRemove.includes(index)
     );

     const rejectedItems = originalOrder.items.filter(
       (item: any, index: number) => itemsToRemove.includes(index)
     );

     // Calculate subtotal before any charges or discounts
     let subtotal = remainingItems.reduce(
       (sum: number, item: any) => sum + item.totalPrice,
       0
     );

     let newTotal = subtotal;

     // Handle promo adjustment if exists
     if (originalOrder.appliedPromo) {
       const discount =
         (newTotal * originalOrder.appliedPromo.percentage) / 100;
       newTotal = Math.max(0, newTotal - discount);
     }

     // Calculate table delivery charge (5% of total after promo)
     let newTableDeliveryCharge = 0;
     if (originalOrder.tableDeliveryCharge) {
       newTableDeliveryCharge = (newTotal * 0.05);
     }

     // Add table delivery charge to final total
     newTotal += newTableDeliveryCharge;

     // Create rejected order entry for removed items
     const rejectedOrder = {
       ...originalOrder,
       _id: new ObjectId(),
       items: rejectedItems,
       total: 0,
       tableDeliveryCharge: 0,
       order: "rejected",
       status: "rejected",
       rejectedAt: now,
       dispatchedAt: undefined,
       fulfilledAt: undefined,
     };

     await collection.insertOne(rejectedOrder);

     // Send partial rejection email
     try {
       await sendRejectionEmail([{ ...originalOrder, rejectedItems }], true);
     } catch (error) {
       console.error("Failed to send partial rejection email:", error);
     }

     // Update original order
     updateFields.items = remainingItems;
     updateFields.total = newTotal;
     updateFields.tableDeliveryCharge = newTableDeliveryCharge;
   } else if (type === "/dispatch") {
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
     updateFields.tableDeliveryCharge = 0;

     const rejectedOrders = await collection
       .find({ _id: orderIdObj })
       .toArray();

     if (rejectedOrders.length > 0) {
       try {
         await sendRejectionEmail(rejectedOrders, false);
       } catch (error) {
         console.error("Failed to send rejection email:", error);
       }
     }
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

    if (type === "/payment") {
      const order = await collection.findOne({ _id: orderIdObj });
      if (order && order.customerName !== "Manual Order") {
        setTimeout(() => sendSMS(order), 600000);
      }
    }

    res.status(200).json({
      message: "Order updated successfully",
      updatedFields: updateFields,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Error updating order" });
  }
}
