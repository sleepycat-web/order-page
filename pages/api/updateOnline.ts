import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { location, amount, name, paymentType } = req.body;

    if (!location || amount === undefined || !paymentType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { db } = await connectToDatabase();

    let collectionName: string;
    const normalizedLocation = location.trim().toLowerCase();

    if (
      normalizedLocation === "sevoke" ||
      normalizedLocation === "sevoke road"
    ) {
      collectionName = "ExpenseSevoke";
    } else if (normalizedLocation === "dagapur") {
      collectionName = "ExpenseDagapur";
    } else {
      return res.status(400).json({ message: "Invalid location" });
    }

    let category: string;
    switch (paymentType) {
      case "upi":
        category = "UPI Payment";
        break;
      case "extraCash":
        category = "Extra Cash Payment";
        break;
      case "extraUpi":
        category = "Extra UPI Payment";
        break;
      default:
        return res.status(400).json({ message: "Invalid payment type" });
    }

    const document = {
      category,
      amount: Number(amount),
      comment: `${name}`,
      createdAt: new Date(),
    };

    const result = await db.collection(collectionName).insertOne(document);

    if (result.acknowledged) {
      res.status(200).json({
        message: "Payment updated successfully",
        insertedId: result.insertedId,
      });
    } else {
      throw new Error("Insert operation was not acknowledged by MongoDB");
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
}
